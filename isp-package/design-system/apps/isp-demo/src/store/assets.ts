import type { Asset } from './types';

/** Asset type catalog, including legacy types for existing records. */
export interface AssetType { code: string; name: string; cat: string; req: string[] }
export const TYPES: AssetType[] = [
  {"cat": "Design", "code": "PROTOCOL", "name": "Protocol / Amendment", "req": ["Protocol number", "External version / amendment no.", "Amendment type"]},
  {"cat": "Design", "code": "RAW_DATA_SPEC", "name": "Raw Data Spec", "req": []},
  {"cat": "Design", "code": "TFL_MOCKSHELL", "name": "Mock Shell", "req": []},
  {"cat": "Design", "code": "SAP", "name": "SAP", "req": ["SAP external version"]},
  {"cat": "Design", "code": "CRF", "name": "CRF / eCRF export", "req": ["Capture system name", "Form version"]},
  {"cat": "Design", "code": "ACRF", "name": "aCRF", "req": ["Annotated CRF version", "Annotation revision"]},
  {"cat": "Design", "code": "TRANSFER_SPEC", "name": "External Data Transfer Spec", "req": ["Data provider", "Data source ID", "Contract version", "Transfer format"]},
  {"cat": "Design", "code": "ANALYSIS_DATA_SPEC", "name": "Standalone ALS / SDS", "req": ["Actual content role", "External spec version"]},
  {"cat": "Design", "code": "SDTM_SPEC", "name": "SDTM Spec", "req": ["Spec version"]},
  {"cat": "Design", "code": "ADAM_SPEC", "name": "ADaM Spec", "req": ["Spec version"]},
  {"cat": "Design", "code": "TOC_TFL_DEFINITION", "name": "TOC / TFL Definition", "req": []},
  {"cat": "Design", "code": "TABLE_SHELL", "name": "Table Mock Shell", "req": ["Table object ID"]},
  {"cat": "Design", "code": "FIGURE_SHELL", "name": "Figure Mock Shell", "req": ["Figure object ID"]},
  {"cat": "Design", "code": "LISTING_SHELL", "name": "Listing Mock Shell", "req": ["Listing object ID"]},
  {"cat": "Design", "code": "ANALYSIS_DEFINITION_FILE", "name": "Standalone Analysis Definition / ARM file", "req": []},
  {"cat": "Design", "code": "MAPPING_RULE_FILE", "name": "Standalone Mapping / Derivation / Build Rules file", "req": ["Rule category"]},
  {"cat": "Design", "code": "DEFINE_XML", "name": "Define.xml", "req": []},
  {"cat": "Design", "code": "SDRG", "name": "SDRG", "req": []},
  {"cat": "Design", "code": "ADRG", "name": "ADRG", "req": []},
  {"cat": "Code & Scripts", "code": "SDTM_PROGRAM", "name": "SDTM Program", "req": ["Program language", "Program purpose"]},
  {"cat": "Code & Scripts", "code": "ADAM_PROGRAM", "name": "ADaM Program", "req": ["Program language", "Program purpose"]},
  {"cat": "Code & Scripts", "code": "TFL_PRODUCTION_CODE", "name": "TFL Production Code", "req": ["Program language"]},
  {"cat": "Code & Scripts", "code": "TFL_QC_CODE", "name": "TFL QC Code", "req": ["Program language", "QC purpose"]},
  {"cat": "Results & Deliverables", "code": "VALIDATION_REPORT", "name": "Validation Report", "req": ["Validation type", "Validated object version"]},
  {"cat": "Results & Deliverables", "code": "TFL_RESULT", "name": "TFL Result: Table / Figure / Listing", "req": ["Output subtype", "Business object ID"]},
  {"cat": "Results & Deliverables", "code": "QC_RESULT", "name": "QC Result", "req": ["QC result type", "Target version checked"]},
  {"cat": "Results & Deliverables", "code": "EVIDENCE_FILE", "name": "Standalone Evidence file", "req": ["Evidence category"]},
  {"cat": "Results & Deliverables", "code": "EVIDENCE_PACKAGE", "name": "Evidence Package", "req": ["Evidence package purpose", "Fixed member list"]},
  {"cat": "Results & Deliverables", "code": "ANALYSIS_RESULT_PACKAGE", "name": "Analysis Result Package", "req": ["Analysis package purpose"]},
  {"cat": "Results & Deliverables", "code": "DELIVERY_PACKAGE", "name": "Delivery Package", "req": ["Delivery purpose"]},
  {"cat": "Results & Deliverables", "code": "CSR_OUTPUT_PACKAGE", "name": "CSR Output Package", "req": []},
  {"cat": "Results & Deliverables", "code": "SUBMISSION_PACKAGE", "name": "Submission Package", "req": []},
  {"cat": "Results & Deliverables", "code": "EXPORT_FILE", "name": "TOC / TFL Summary / Single TFL / Issue / Historical Export", "req": ["Export subtype", "Export source version", "Existing file format"]},
];
export const TYPE = (code: string): AssetType | undefined => {
  const name = CODE_TYPES[code];
  return name ? { code, name, cat: 'Code & Scripts', req: [] } : TYPES.find((t) => t.code === code);
};
export const FILE_UPLOAD_GROUPS = [
  { label: 'Study Design', codes: ['PROTOCOL', 'SAP'] },
  { label: 'Study Spec', codes: ['RAW_DATA_SPEC', 'CRF', 'ACRF', 'ANALYSIS_DATA_SPEC', 'SDTM_SPEC', 'ADAM_SPEC', 'TFL_MOCKSHELL'] },
];
export const DS_CATS = ['RawData', 'SDTM', 'ADaM', 'Intermediate'] as const;
export const SCOPES: [string, string][] = [['EXPLORATORY', 'Exploratory'], ['INTERIM', 'Interim'], ['FORMAL', 'Formal'], ['SUPPLEMENTAL', 'Supplemental']];
export const FILE_OK = ['pdf', 'docx', 'rtf', 'txt', 'csv', 'xlsx', 'sas', 'r', 'py', 'json', 'xml'];
export const SHORT: Record<string, string> = { PROTOCOL: 'Protocol', SAP: 'SAP', CRF: 'CRF', ACRF: 'aCRF', ADAM_SPEC: 'ADaM Spec', SDTM_SPEC: 'SDTM Spec', TOC_TFL_DEFINITION: 'TOC', TABLE_SHELL: 'Shell', TFL_PRODUCTION_CODE: 'Prod. code' };
export const MODE_SPACE: Record<string, 'dummy' | 'synthetic' | 'prod'> = { Dummy: 'dummy', Synthetic: 'synthetic', PROD: 'prod' };

export const CODE_TYPES: Record<string, string> = {
  SDTM_PROGRAM: 'SDTM Code (DEV)',
  ADAM_PROGRAM: 'ADaM Code (DEV)',
  TFL_PRODUCTION_CODE: 'TFL Code (DEV)',
  SDTM_QC_PROGRAM: 'SDTM Code (QC)',
  ADAM_QC_PROGRAM: 'ADaM Code (QC)',
  TFL_QC_CODE: 'TFL Code (QC)',
};

export function assetDirectoryType(asset: Asset) {
  const { code, tl } = asset;
  if (code === 'PROTOCOL' || code === 'SAP') return { name: code === 'SAP' ? 'SAP' : 'Protocol', group: 'Study Design' };
  if (CODE_TYPES[code]) return { name: CODE_TYPES[code], group: 'Code' };
  if (['TABLE_SHELL', 'FIGURE_SHELL', 'LISTING_SHELL'].includes(code)) return { name: 'Mock Shell', group: 'Study Spec' };
  return { name: tl, group: TYPE(code)?.cat === 'Design' || code === 'RAW_SCHEMA' ? 'Study Spec' : 'Other' };
}
