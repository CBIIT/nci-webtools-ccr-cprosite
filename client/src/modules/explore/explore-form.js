import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import classNames from "classnames";
import { useRecoilValue } from "recoil";
import { fieldsState, defaultFormState } from "./explore.state";
import { useState } from "react";

export default function ExploreForm({ onSubmit, onReset }) {
  const fields = useRecoilValue(fieldsState);
  const [form, setForm] = useState(defaultFormState);
  const mergeForm = (obj) => setForm({ ...form, ...obj });

  function handleChange(event) {
    const { name, value } = event.target;
    // todo: validate selected gene
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
    // Add all cancer types if "All Tumor Types" is selected
    if (name === "cancer" && selection.find((option) => option.value === 0))
      selection = fields.cancer.slice(1);
    mergeForm({ [name]: selection });
  }

  // avoid loading all genes as Select options
  function filterGenes(value, limit = 100) {
    return fields.gene
      .filter((gene) => !value || gene.label.startsWith(value.toUpperCase()))
      .slice(0, limit);
  }

  return (
    <Form onSubmit={handleSubmit} onReset={handleReset}>
      <Form.Group className="mb-3" controlId="cancer">
        <Form.Label className="required">Tumor Types</Form.Label>
        <Select
          placeholder="No cancer selected"
          name="cancer"
          isMulti="true"
          value={form.cancer}
          onChange={(ev) => handleSelectChange("cancer", ev)}
          options={fields.cancer}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="dataset">
        <Form.Label className="required">Dataset</Form.Label>
        <Form.Select
          name="dataset"
          value={form.dataset}
          onChange={handleChange}
          required>
          <option value="" hidden>
            No dataset selected
          </option>
          <option value="protein-abundance">Protein Abundance</option>
          <option value="phosphorylation-site">Phosphorylation Site</option>
          <option value="phosphorylation-protein">
            Phosphorylation/Protein
          </option>
          <option value="rna-level">RNA Level</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="analysis">
        <Form.Label className="required">Analysis</Form.Label>
        <Form.Select
          name="analysis"
          value={form.analysis}
          onChange={(e) => {
            if (e.target.value === "tumor-control")
              mergeForm({
                ["correlatedGene"]: "",
                ["analysis"]: "tumor-control",
              });
            else handleChange(e);
          }}
          required>
          <option value="" hidden>
            No analysis selected
          </option>
          <option value="tumor-control">Tumor vs Control</option>
          <option value="correlation">Correlation</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="gene">
        <Form.Label className="required">Gene</Form.Label>
        <AsyncSelect
          placeholder="No gene selected"
          name="gene"
          value={form.gene}
          onChange={(ev) => handleSelectChange("gene", ev)}
          defaultOptions
          loadOptions={(inputValue, callback) =>
            callback(filterGenes(inputValue))
          }
          clearIndicator
        />
      </Form.Group>

      {form.analysis === "correlation" && (
        <fieldset
          disabled={form.analysis !== "correlation"}
          className="border px-3 mb-4">
          <legend className="legend">Correlation</legend>

          <Form.Group className="mb-3">
            <Form.Check
              inline
              label="To Another Protein"
              name="correlation"
              type="radio"
              id="correlationToAnotherProtein"
              value="toAnotherProtein"
              checked={
                form.analysis === "correlation" &&
                form.correlation === "toAnotherProtein"
              }
              onChange={handleChange}
            />

            <Form.Check
              inline
              label="Protein and mRNA"
              name="correlation"
              type="radio"
              id={`correlationMRNA`}
              value="proteinMRNA"
              checked={
                form.analysis === "correlation" &&
                form.correlation === "proteinMRNA"
              }
              onChange={handleChange}
            />
          </Form.Group>

          {form.correlation === "toAnotherProtein" && (
            <Form.Group className="mb-3" controlId="correlated-gene">
              <Form.Label
                className={classNames(
                  "required",
                  (form.analysis !== "correlation" ||
                    form.correlation !== "toAnotherProtein") &&
                    "text-muted",
                )}>
                Correlated Gene
              </Form.Label>
              <AsyncSelect
                placeholder="No gene selected"
                name="correlatedGene"
                value={form.correlatedGene}
                onChange={(ev) => handleSelectChange("correlatedGene", ev)}
                defaultOptions
                loadOptions={(inputValue, callback) =>
                  callback(filterGenes(inputValue))
                }
                clearIndicator
              />
            </Form.Group>
          )}
        </fieldset>
      )}

      <div className="text-end">
        <Button variant="outline-danger" className="me-1" type="reset">
          Reset
        </Button>

        <Button variant="primary" type="submit">
          Submit
        </Button>
      </div>
    </Form>
  );
}
