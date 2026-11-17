/** Review TOC 的 Mock 内容（SAP 正文、章节、输出）；均非真实数据 */
export interface SapRef { k: 'sap' | 'shell'; t: string }
export interface TocVar { name: string; src: SapRef[] }
export interface TocOutput {
  id: string; no: string; title: string; type: 'Table' | 'Listing'; pop: string; popSrc: string[]; why: string;
  scope: string; scopeSrc: string[]; present: string; presentSrc: string[]; vars: TocVar[]; moreText?: string;
}
export interface SapSeg { t: string; c?: string[] }
export interface SapPara { id: string; kind: '' | 'li'; segs: SapSeg[] }
export interface Chapter { id: string; no: string; title: string; live?: boolean; items?: { no: string; title: string; reviewed?: boolean; orphan?: boolean }[] }

const sap = (t: string): SapRef[] => [{ k: 'sap', t }];
const SHELL: SapRef[] = [{ k: 'shell', t: 'Shell' }];
const V = (name: string, src: SapRef[]): TocVar => ({ name, src });
const WHY_FAS = 'SAP P180 says "Based on the FAS"; FAS is defined in SAP §3, Table 7.';

export const SAP_TITLE = 'Statistical Analysis Plan (SAP) AG-123-122 v1.0';
export const SAP_FILE = 'AG_SAP_1.0_20260608_clean.docx';
export const SECTION = { no: '4.2.3', title: 'Demographics and Baseline Characteristics' };

export const PARAS: SapPara[] = [
  { id: 'P180', kind: '', segs: [
    { t: 'Based on the FAS, ', c: ['i1', 'i2', 'i3', 'i4'] },
    { t: 'descriptive statistics of the following demographic and baseline characteristics of participants are presented by sequence and in total, including:', c: ['i1', 'i2'] }] },
  { id: 'P181', kind: 'li', segs: [{ t: 'Demographics: age, sex, fertility potential (females only), race, ethnicity, height, weight, BMI;', c: ['i1', 'i3'] }] },
  { id: 'P182', kind: 'li', segs: [{ t: 'Other baseline characteristics: presence of past or current medical history, presence of prior medication history, presence of allergy history, infectious disease screening, urine drug abuse screening, alcohol breath test, chest PA X-ray, nicotine screening, T-SPOT;', c: ['i2', 'i4'] }] },
  { id: 'P183', kind: '', segs: [{ t: 'The listing presents participant demographics and other baseline characteristics.', c: ['i3', 'i4'] }] },
];

const base = { pop: 'FAS', popSrc: ['P180'], why: WHY_FAS, present: 'By sequence and Total; each variable shown as continuous or categorical', presentSrc: ['P180'] };
const listing = { pop: 'FAS', popSrc: ['P180'], why: WHY_FAS, present: 'Listed by participant', presentSrc: ['P183'] };

export const OUTPUTS: TocOutput[] = [
  { ...base, id: 'i1', no: '14.1.3.1', title: 'Summary of Demographics — Full Analysis Set', type: 'Table',
    scope: 'Population and reporting object as defined by this item', scopeSrc: ['P180'],
    vars: ['Age (years)', 'Sex, n (%)', 'If female, of childbearing potential, n(%) (females only)', 'Race, n (%)', 'Ethnicity, n (%)', 'Height (cm)', 'Weight (kg)', 'BMI'].map((n) => V(n, sap('P181'))) },
  { ...base, id: 'i2', no: '14.1.3.2', title: 'Summary of Other Baseline Characteristics — Full Analysis Set', type: 'Table',
    scope: 'Population and reporting object as defined by this item', scopeSrc: ['P180'],
    vars: [
      V('Any past/current medical history?, n (%)', sap('P182')),
      V('Any prior medication history?, n (%)', sap('P182')),
      V('Any prior surgical history?, n (%)', SHELL),
      V('Smoked ≥1 cigarette daily within 3 months before screening, or unable to stop all tobacco products during the study?, n (%)', SHELL),
      V('Regular alcohol use within 3 months before screening, or unable to stop alcohol during the study, or took any alcohol-containing product within 24h before dosing?, n (%)', SHELL),
      V('Blood donation/blood loss within 3 months before screening?, n (%)', SHELL),
      V('Allergic to drugs or food?, n (%)', sap('P182')),
      V('Infectious disease screening → Hepatitis B surface antigen, n (%)', sap('P182')),
      V('Infectious disease screening → Hepatitis B core antibody, n (%)', sap('P182')),
      V('Urine drug abuse screening → THC acid, n (%)', sap('P182')),
      V('Urine drug abuse screening → Morphine', sap('P182')),
      V('Alcohol breath test, n (%)', sap('P182')),
      V('Took part in any other clinical trial using an investigational device or drug within 3 months before screening?', SHELL),
      V('Received any vaccine within 30 days before screening?', SHELL),
      V('Nicotine screening', sap('P182')),
      V('T-SPOT', sap('P182')),
      V('Chest PA X-ray', sap('P182')),
    ] },
  { ...listing, id: 'i3', no: '16.2.3.1', title: 'Listing of Demographics — Full Analysis Set', type: 'Listing', moreText: '8 more fields',
    scope: 'Participant inclusion: FAS participants who meet the reporting object of this item; records listed: all applicable records of the demographics listing, including applicable unscheduled visits', scopeSrc: ['P183'],
    vars: ['Screening No.', 'Randomization No.', 'Sequence group', 'Date of birth'].map((n) => V(n, sap('P183'))) },
  { ...listing, id: 'i4', no: '16.2.3.2', title: 'Listing of Other Baseline Information — Full Analysis Set', type: 'Listing', moreText: '4 more fields',
    scope: 'Participant inclusion: FAS participants who meet the reporting object of this item; records listed: all applicable records of the other baseline information listing, including applicable unscheduled visits', scopeSrc: ['P182', 'P183'],
    vars: ['Screening No.', 'Randomization No.', 'Sequence group', 'Visit/assessment time'].map((n) => V(n, sap('P183'))) },
];

export const CHAPTERS: Chapter[] = [
  { id: 'c1', no: '4.2.1', title: 'Participant Disposition', items: [{ no: '14.1.1.1', title: 'Participant Disposition — All Participants', reviewed: true }, { no: '14.1.1.2', title: 'Summary of Analysis Sets', reviewed: true }] },
  { id: 'c2', no: '4.2.2', title: 'Protocol Deviations', items: [{ no: '14.1.2.1', title: 'Summary of Protocol Deviations', reviewed: true }, { no: '16.2.2.1', title: 'Listing of Protocol Deviations', reviewed: true }] },
  { id: 'c3', no: SECTION.no, title: SECTION.title, live: true },
  { id: 'c4', no: '4.2.4', title: 'Pre-Treatment Events, Past/Current Medical History and Surgical History', items: [{ no: '14.1.4.1', title: 'Summary of Pre-Treatment Events' }, { no: '16.2.4.1', title: 'Listing of Medical History' }] },
  { id: 'c5', no: '4.2.5', title: 'Prior/Concomitant Medications, Non-drug Therapies', items: [{ no: '14.1.5.1', title: 'Summary of Prior Medications' }] },
  { id: 'c6', no: '4.2.6', title: 'Participant Exposure and Treatment Compliance', items: [{ no: '14.1.6.1', title: 'Summary of Exposure' }, { no: '16.2.6.1', title: 'Listing of Dosing Records' }] },
  { id: 'c7', no: '4.4', title: 'Safety Analysis', items: [{ no: '14.3.1.1', title: 'Summary of Adverse Events' }, { no: '16.2.7.9', title: 'Manually added output', orphan: true }] },
];
