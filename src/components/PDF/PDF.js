import React, { useState, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import "./PDF.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function PDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [formFields, setFormFields] = useState({});
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);

  useEffect(() => {
    if (pdfFile) {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const data = new Uint8Array(fileReader.result);
        const loadingTask = pdfjs.getDocument(data);

        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      };
      fileReader.readAsArrayBuffer(pdfFile);
    }
  }, [pdfFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setFormFields({});
      setPageNumber(1);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prevFields) => ({ ...prevFields, [name]: value }));
  };

  const fillFormFields = async (pdfData) => {
    if (!pdfData) return null;
    const data = new Uint8Array(pdfData);

    const pdf = await pdfjs.getDocument(data).promise;
    const clonedPdf = pdf;

    const pagesPromises = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      pagesPromises.push(fillPageFields(clonedPdf, i));
    }
    await Promise.all(pagesPromises);

    return clonedPdf;
  };

  const clonePDFDocument = async (pdfData) => {
    if (!pdfData) return null;
    const data = new Uint8Array(pdfData);
    return await pdfjs.getDocument(data).promise;
  };

  const savePdf = async (e) => {
    if (!pdfFile) return;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const newPdf = await clonePDFDocument(arrayBuffer);

    const blob = new Blob([newPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = e.target.value;
    link.click();

    URL.revokeObjectURL(url);
  };

  const fillPageFields = async (pdfDoc, pageNumber) => {
    const page = await pdfDoc.getPage(pageNumber);

    const annotations = await page.getAnnotations();
    if (!annotations) return;
    annotations.forEach((annotation) => {
      if (annotation.fieldName && formFields[annotation.fieldName]) {
        annotation.fieldValue = formFields[annotation.fieldName];
      }
    });
  };

  return (
    <div className="pdf-wrap">
      <div>
        <input
          className="pdf-input"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </div>
      {pdfFile && (
        <div>
          <div>
            <p className="pdf-text">
              Page {pageNumber} of {numPages}
            </p>
          </div>
          <div className="pdf-btns">
            <button
              className="pdf-btn"
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}>
              Previous
            </button>
            <button
              className="pdf-btn"
              onClick={() =>
                setPageNumber((prev) => Math.min(prev + 1, numPages))
              }
              disabled={pageNumber >= numPages}>
              Next
            </button>
          </div>
          <div>
            {Object.keys(formFields).map((fieldName) => (
              <input
                key={fieldName}
                type="text"
                name={fieldName}
                value={formFields[fieldName]}
                onChange={handleFormChange}
                placeholder={fieldName}
              />
            ))}
          </div>
          <button className="pdf-save-btn" onClick={savePdf}>
            Save PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default PDF;
