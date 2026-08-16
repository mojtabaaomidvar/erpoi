import JSZip from "jszip";

export interface NcrDocumentReferenceData {
  number: string;
  title: string;
  revision?: string;
  clauseSection?: string;
}

export interface NcrDocumentExportData {
  fileName: string;
  number: string;
  revision: string;
  date: string;
  isClosed: boolean;
  projectTitle: string;
  clientName: string;
  vendorName: string;
  inspectionDate: string;
  inspectionLocation: string;
  equipmentItem: string;
  tagSerialNumber: string;
  inspectionStages: string[];
  classification: "MAJOR" | "MINOR" | "OBSERVATION" | "HOLD_POINT";
  documentReferences: NcrDocumentReferenceData[];
  description: string;
  evidence: string;
  immediateContainment: string;
  correctiveAction: string;
  targetCompletionDate: string;
  verification: string;
  closeoutDecision?:
    | "ACCEPTED_CLOSED"
    | "REJECTED_NEW_NCR"
    | "CONDITIONALLY_ACCEPTED";
  closeoutNote: string;
  closeoutDate: string;
  inspectorName: string;
  vendorRepresentativeName: string;
  clientRepresentativeName: string;
}

const WORD_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const directChildren = (element: Element, localName: string): Element[] =>
  Array.from(element.children).filter((child) => child.localName === localName);

const tables = (document: XMLDocument): Element[] =>
  Array.from(document.getElementsByTagNameNS(WORD_NAMESPACE, "tbl"));

const rows = (table: Element): Element[] => directChildren(table, "tr");
const cells = (row: Element): Element[] => directChildren(row, "tc");

function setCellText(cell: Element, value: string): void {
  const textNodes = Array.from(
    cell.getElementsByTagNameNS(WORD_NAMESPACE, "t"),
  );
  if (textNodes.length === 0) return;
  textNodes[0].textContent = value;
  textNodes[0].setAttribute("xml:space", "preserve");
  textNodes.slice(1).forEach((node) => {
    node.textContent = "";
  });
}

function setCell(
  document: XMLDocument,
  tableIndex: number,
  rowIndex: number,
  cellIndex: number,
  value: string,
): void {
  const table = tables(document)[tableIndex];
  const cell = table && cells(rows(table)[rowIndex])[cellIndex];
  if (!cell) {
    throw new Error(
      `Invalid NCR template cell ${tableIndex}:${rowIndex}:${cellIndex}`,
    );
  }
  setCellText(cell, value);
}

function checked(selected: boolean, label: string): string {
  return `${selected ? "☒" : "☐"} ${label}`;
}

function stageText(stages: string[]): string {
  const selected = (pattern: RegExp) =>
    stages.some((stage) => pattern.test(stage));
  return [
    checked(selected(/pre.?inspection|meeting/i), "Pre-Inspection Meeting"),
    checked(selected(/in.?process/i), "In-Process"),
    checked(selected(/final/i), "Final Inspection"),
    checked(selected(/pre.?shipment/i), "Pre-Shipment"),
  ].join("   ");
}

function classificationText(
  classification: NcrDocumentExportData["classification"],
): string[] {
  return [
    checked(classification === "MAJOR", "MAJOR"),
    checked(classification === "MINOR", "MINOR"),
    checked(classification === "OBSERVATION", "OBSERVATION"),
    checked(classification === "HOLD_POINT", "HOLD POINT"),
  ];
}

function decisionText(data: NcrDocumentExportData): string {
  return [
    "Close-out Decision:",
    checked(data.closeoutDecision === "ACCEPTED_CLOSED", "Accepted & Closed"),
    checked(
      data.closeoutDecision === "REJECTED_NEW_NCR",
      "Rejected - New NCR Required",
    ),
    checked(
      data.closeoutDecision === "CONDITIONALLY_ACCEPTED",
      "Conditionally Accepted",
    ),
    `Note: ${data.closeoutNote}`,
  ].join("   ");
}

async function parseXml(zip: JSZip, path: string): Promise<XMLDocument> {
  const source = await zip.file(path)?.async("string");
  if (!source) throw new Error(`The NCR template is missing ${path}`);
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error(`The NCR template contains invalid XML in ${path}`);
  }
  return document;
}

function serialize(document: XMLDocument): string {
  return new XMLSerializer().serializeToString(document);
}

function populateHeader(
  document: XMLDocument,
  data: NcrDocumentExportData,
): void {
  setCell(document, 0, 0, 1, `NCR No.: ${data.number}`);
  setCell(document, 0, 1, 2, `Rev.: ${data.revision}`);
  setCell(document, 0, 2, 2, `Date: ${data.date}`);
  setCell(
    document,
    0,
    3,
    3,
    `${checked(!data.isClosed, "Open")}   ${checked(data.isClosed, "Closed")}`,
  );
  setCell(document, 1, 0, 1, data.projectTitle);
  setCell(document, 1, 1, 1, data.clientName);
  setCell(document, 1, 1, 3, data.vendorName);
  setCell(document, 1, 2, 1, data.inspectionDate);
  setCell(document, 1, 2, 3, data.inspectionLocation);
  setCell(document, 1, 3, 1, data.equipmentItem);
  setCell(document, 1, 3, 3, data.tagSerialNumber);
  setCell(document, 1, 4, 1, stageText(data.inspectionStages));
}

function populateBody(
  document: XMLDocument,
  data: NcrDocumentExportData,
): void {
  const references = data.documentReferences.length
    ? data.documentReferences
    : [{ number: "", title: "", revision: "", clauseSection: "" }];
  const referenceTable = tables(document)[0];
  const referenceRows = rows(referenceTable);
  const templateRow = referenceRows[2];
  references.forEach((reference, index) => {
    const row =
      index === 0 ? templateRow : (templateRow.cloneNode(true) as Element);
    if (index > 0) referenceTable.appendChild(row);
    const rowCells = cells(row);
    [
      String(index + 1),
      reference.number,
      reference.title,
      reference.revision || "",
      reference.clauseSection || "",
    ].forEach((value, cellIndex) => setCellText(rowCells[cellIndex], value));
  });

  classificationText(data.classification).forEach((value, index) => {
    setCell(document, 1, 1, index, value);
  });
  setCell(document, 2, 2, 0, data.description);
  setCell(document, 2, 4, 0, data.evidence);
  setCell(document, 3, 2, 0, data.immediateContainment);
  setCell(
    document,
    3,
    4,
    0,
    [
      data.correctiveAction,
      data.targetCompletionDate
        ? `Target Completion Date: ${data.targetCompletionDate}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  setCell(document, 4, 1, 0, data.verification);
  setCell(document, 4, 2, 0, decisionText(data));
  setCell(document, 4, 3, 0, `Date of Close-out: ${data.closeoutDate}`);
}

function populateFooter(
  document: XMLDocument,
  data: NcrDocumentExportData,
): void {
  setCell(document, 0, 1, 0, `Name: ${data.inspectorName}`);
  setCell(document, 0, 1, 1, `Name: ${data.vendorRepresentativeName}`);
  setCell(document, 0, 1, 2, `Name: ${data.clientRepresentativeName}`);
}

export async function generateNcrDocx(
  data: NcrDocumentExportData,
): Promise<Blob> {
  const response = await fetch("/templates/non-conformity-report-tpi.docx");
  if (!response.ok) {
    throw new Error("Could not load the NCR Word template");
  }
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const header = await parseXml(zip, "word/header2.xml");
  const body = await parseXml(zip, "word/document.xml");
  const footer = await parseXml(zip, "word/footer2.xml");

  populateHeader(header, data);
  populateBody(body, data);
  populateFooter(footer, data);
  zip.file("word/header2.xml", serialize(header));
  zip.file("word/document.xml", serialize(body));
  zip.file("word/footer2.xml", serialize(footer));

  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export async function downloadNcrDocx(
  data: NcrDocumentExportData,
): Promise<void> {
  const blob = await generateNcrDocx(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = data.fileName.endsWith(".docx")
    ? data.fileName
    : `${data.fileName}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
