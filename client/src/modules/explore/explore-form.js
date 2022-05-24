import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import classNames from "classnames";
import { useRecoilState, useRecoilValue } from "recoil";
import { cancerState, formState, defaultFormState, geneState } from "./explore.state";
import { useState } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

export default function ExploreForm({ onSubmit, onReset }) {
  const cancer = useRecoilValue(cancerState);
  const [form, setForm] = useState(defaultFormState);
  const mergeForm = (obj) => setForm({ ...form, ...obj });
  const genes = useRecoilValue(geneState).records.map((e) => {
    return { value: e.id, label: e.name };
  });

  const tumors = cancer.records.map((e) => {
    return { value: e.id, label: e.name, singlePool: e.singlePool };
  });

  function handleChange(event) {
    const { name, value } = event.target;
    // todo: validate selected gene
    if (name === "cancer") value = [value];

    mergeForm({ [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (onSubmit) onSubmit(form);
  }

  function handleReset(event) {
    event.preventDefault();
    setForm(defaultFormState);
    if (onReset) onReset(defaultFormState);
  }

  function handleSelectChange(name, selection = []) {
    mergeForm({ [name]: selection });
  }

  // avoid loading all genes as Select options
  function filterGenes(value, limit = 100) {
    return genes
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter((gene) => !value || gene.label.startsWith(value.toUpperCase()))
      .slice(0, limit);
  }

  function isValid() {
    if (form.analysis.value === "correlation" && form.correlation === "toAnotherProtein" && !form.correlatedGene)
      return false;

    return form.cancer && form.dataset && form.analysis && form.gene;
  }

  console.log(form);

  return (
    <Form onSubmit={handleSubmit} onReset={handleReset}>
      <Form.Group className="mb-3" controlId="cancer">
        <Form.Label className="required">Tumor Types</Form.Label>
        <Select
          placeholder="No cancer selected"
          name="cancer"
          value={form.cancer}
          onChange={(ev) => handleSelectChange("cancer", ev)}
          options={tumors}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="dataset">
        <Form.Label className="required">Dataset</Form.Label>
        <Select
          name="dataset"
          placeholder="No dataset selected"
          value={form.dataset}
          onChange={(e) => {
            if (
              form.analysis.value === "correlation" &&
              (e.value === "phosphoproteinData" || e.value === "phosphoproteinRatioData")
            ) {
              mergeForm({
                ["dataset"]: e,
                ["correlation"]: "toAnotherProtein",
                ["correlatedGene"]: "",
              });
            } else handleSelectChange("dataset", e);
          }}
          options={[
            { value: "proteinData", label: "Relative Protein Abundance" },
            { value: "phosphoproteinData", label: "Phosphorylation Site" },
            {
              value: "phosphoproteinRatioData",
              label: "Phosphorylation/Protein",
            },
          ]}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="analysis">
        <Form.Label className="required">Analysis</Form.Label>
        <Select
          placeholder="No analysis selected"
          name="analysis"
          value={form.analysis}
          options={[
            { value: "tumor-control", label: "Tumor vs Normal Tissue Adjacent to the Tumor" },
            { value: "correlation", label: "Correlation" },
          ]}
          onChange={(e) => {
            if (e.value === "tumor-control")
              mergeForm({
                ["correlatedGene"]: "",
                ["correlation"]: "toAnotherProtein",
                ["analysis"]: e,
              });
            else handleSelectChange("analysis", e);
          }}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="gene">
        <Form.Label className="required">Gene</Form.Label>
        <AsyncSelect
          placeholder="No gene selected"
          name="gene"
          value={form.gene}
          onChange={(ev) => handleSelectChange("gene", ev)}
          defaultOptions
          loadOptions={(inputValue, callback) => callback(filterGenes(inputValue))}
          clearIndicator
        />
      </Form.Group>

      {form.analysis.value === "correlation" && (
        <fieldset disabled={form.analysis.value !== "correlation"} className="border px-3 mb-4">
          <legend className="legend">Correlation</legend>

          <Form.Group className="mb-3">
            <Form.Check
              inline
              label="To Another Protein"
              name="correlation"
              type="radio"
              id="correlationToAnotherProtein"
              value="toAnotherProtein"
              checked={form.analysis.value === "correlation" && form.correlation === "toAnotherProtein"}
              onChange={handleChange}
            />

            <Form.Check
              inline
              label="Protein and mRNA"
              name="correlation"
              type="radio"
              disabled={form.dataset.value === "phosphoproteinData" || form.dataset.value === "phosphoproteinRatioData"}
              id={`correlationMRNA`}
              value="proteinMRNA"
              checked={form.analysis.value === "correlation" && form.correlation === "proteinMRNA"}
              onChange={(e) => {
                mergeForm({
                  ["correlation"]: "proteinMRNA",
                  ["correlatedGene"]: "",
                });
              }}
            />
          </Form.Group>

          {form.correlation === "toAnotherProtein" && (
            <Form.Group className="mb-3" controlId="correlated-gene">
              <Form.Label
                className={classNames(
                  "required",
                  (form.analysis.value !== "correlation" || form.correlation !== "toAnotherProtein") && "text-muted",
                )}>
                Correlated Gene
              </Form.Label>
              <AsyncSelect
                placeholder="No gene selected"
                name="correlatedGene"
                value={form.correlatedGene}
                onChange={(ev) => handleSelectChange("correlatedGene", ev)}
                defaultOptions
                loadOptions={(inputValue, callback) => callback(filterGenes(inputValue))}
                clearIndicator
              />
            </Form.Group>
          )}
        </fieldset>
      )}

      <div className="text-end">
        <Button variant="outline-secondary" className="me-1" type="reset">
          Reset
        </Button>

        <OverlayTrigger
          overlay={!isValid() ? <Tooltip id="phos_tumor_val">Missing Required Parameters</Tooltip> : <></>}>
          <Button variant="primary" type="submit" disabled={!isValid()}>
            Submit
          </Button>
        </OverlayTrigger>
      </div>
    </Form>
  );
}
