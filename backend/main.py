import io
import json
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
import psycopg
from fastapi import FastAPI, Header, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, StreamingResponse
from openpyxl import Workbook
from pydantic import BaseModel, Field
from psycopg.rows import dict_row

MARKET = os.getenv("MARKET", "").upper()
DATABASE_URL = os.getenv("DATABASE_URL", "")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_BUCKET = os.getenv("S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "auto")
RULES_FILE = os.getenv("RULES_FILE", f"/app/rules/{MARKET}.json")

if not MARKET:
    raise RuntimeError("MARKET is required")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required")

with open(RULES_FILE, "r", encoding="utf-8") as fh:
    RULES = json.load(fh)
if RULES.get("market") != MARKET:
    raise RuntimeError("rules market mismatch")

app = FastAPI(title=f"LUUNA CapitalReady {MARKET}", version="1.0.0")

class CasePayload(BaseModel):
    market: str
    applicationType: str = Field(pattern="^(personal|company)$")
    submittedAt: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)

class UploadPayload(BaseModel):
    market: str
    filename: str
    contentType: str
    size: int | None = None
    fieldName: str | None = None

class CompleteUploadPayload(BaseModel):
    market: str

def ensure_market(payload_market: str, header_market: str | None = None):
    pm = (payload_market or "").upper()
    hm = (header_market or pm).upper()
    if pm != MARKET or hm != MARKET:
        raise HTTPException(status_code=409, detail="market_mismatch")
    if str(RULES.get("status", "")).startswith("disabled"):
        raise HTTPException(status_code=503, detail="market_disabled_pending_rules_review")

def validate_case(payload: CasePayload):
    required = list(RULES.get("requiredFields", []))
    if payload.applicationType == "company":
        required.extend(RULES.get("companyRequiredFields", []))
    missing = []
    for key in required:
        value = payload.data.get(key)
        if value is None or value is False or (isinstance(value, str) and not value.strip()):
            missing.append(key)
    if missing:
        raise HTTPException(status_code=422, detail={"code":"missing_required_fields","fields":sorted(set(missing))})

def connect():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

def make_reference() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"AMF-{MARKET}-{stamp}-{secrets.token_hex(3).upper()}"

@app.get("/healthz")
def healthz():
    return {"ok": True, "market": MARKET, "rulesVersion": RULES.get("version"), "rulesStatus": RULES.get("status")}

@app.post("/v1/cases", status_code=201)
def create_case(payload: CasePayload, x_annator_market: str | None = Header(default=None)):
    ensure_market(payload.market, x_annator_market)
    validate_case(payload)
    ref = make_reference()
    raw = dict(payload.data)
    raw["submittedAt"] = payload.submittedAt
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """insert into cases(reference, market, application_type, raw_submission, rules_version)
               values (%s,%s,%s,%s::jsonb,%s) returning id, reference, status, stage, created_at""",
            (ref, MARKET, payload.applicationType, json.dumps(raw), RULES.get("version")),
        )
        row = cur.fetchone()
        conn.commit()
    return {"caseId": str(row["id"]), "reference": row["reference"], "market": MARKET, "status": row["status"], "stage": row["stage"], "createdAt": row["created_at"]}

@app.post("/v1/cases/{case_id}/uploads", status_code=201)
def create_upload(case_id: str, payload: UploadPayload, x_annator_market: str | None = Header(default=None)):
    ensure_market(payload.market, x_annator_market)
    if not S3_BUCKET or not S3_ENDPOINT_URL:
        raise HTTPException(status_code=503, detail="private_storage_not_configured")
    safe_name = Path(payload.filename).name.replace("\\", "_").replace("/", "_")
    storage_key = f"{MARKET.lower()}/{case_id}/{secrets.token_hex(8)}-{safe_name}"
    s3 = boto3.client("s3", endpoint_url=S3_ENDPOINT_URL, region_name=AWS_REGION)
    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": storage_key, "ContentType": payload.contentType},
        ExpiresIn=900,
    )
    with connect() as conn, conn.cursor() as cur:
        cur.execute("select 1 from cases where id=%s and market=%s", (case_id, MARKET))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="case_not_found")
        cur.execute(
            """insert into documents(case_id, document_type, original_filename, mime_type, size_bytes, storage_provider, storage_key, upload_status)
               values (%s,%s,%s,%s,%s,'s3-compatible',%s,'awaiting_upload') returning id""",
            (case_id, payload.fieldName or "other", safe_name, payload.contentType, payload.size, storage_key),
        )
        doc = cur.fetchone()
        conn.commit()
    return {"documentId": str(doc["id"]), "uploadUrl": upload_url, "method": "PUT", "headers": {"Content-Type": payload.contentType}}

@app.post("/v1/cases/{case_id}/uploads/{document_id}/complete")
def complete_upload(case_id: str, document_id: str, payload: CompleteUploadPayload, x_annator_market: str | None = Header(default=None)):
    ensure_market(payload.market, x_annator_market)
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """update documents set upload_status='uploaded', extraction_status='queued'
               where id=%s and case_id=%s returning id""",
            (document_id, case_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="document_not_found")
        conn.commit()
    return {"ok": True, "documentId": document_id, "status": "uploaded", "extractionStatus": "queued"}

def load_case_bundle(case_id: str):
    with connect() as conn, conn.cursor() as cur:
        cur.execute("select * from cases where id=%s and market=%s", (case_id, MARKET))
        case = cur.fetchone()
        if not case:
            raise HTTPException(status_code=404, detail="case_not_found")
        bundle = {"case": case}
        for table in ("facts", "documents", "document_extractions", "bank_accounts", "bank_transactions", "risks", "action_items"):
            cur.execute(f"select * from {table} where case_id=%s order by created_at asc", (case_id,))
            bundle[table] = cur.fetchall()
        return bundle

@app.get("/v1/cases/{case_id}/export.json")
def export_json(case_id: str):
    return JSONResponse(content=jsonable_encoder(load_case_bundle(case_id)))

@app.get("/v1/cases/{case_id}/export.xlsx")
def export_xlsx(case_id: str):
    bundle = load_case_bundle(case_id)
    wb = Workbook()
    ws = wb.active
    ws.title = "00_KOKKUVOTE"
    case = bundle["case"]
    ws.append(["Väli", "Väärtus"])
    for key in ("reference","market","application_type","status","stage","rules_version","created_at"):
        ws.append([key, str(case.get(key, ""))])

    sheet_map = {
        "_DATA_FACTS": bundle["facts"],
        "_DATA_DOCUMENTS": bundle["documents"],
        "_DATA_EXTRACTIONS": bundle["document_extractions"],
        "_DATA_BANK_ACCOUNTS": bundle["bank_accounts"],
        "_DATA_BANK_TX": bundle["bank_transactions"],
        "_DATA_RISKS": bundle["risks"],
        "_DATA_ACTIONS": bundle["action_items"],
    }
    for name, rows in sheet_map.items():
        sh = wb.create_sheet(name)
        if rows:
            headers = list(rows[0].keys())
            sh.append(headers)
            for row in rows:
                sh.append([str(row.get(h, "")) if row.get(h) is not None else None for h in headers])
        else:
            sh.append(["no_data"])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    filename = f"{case['reference']}.xlsx"
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
