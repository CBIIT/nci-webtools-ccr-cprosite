import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Select from "react-select";
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

  function handleMultiChange(selection = []) {
    // Add all cancer types if "All Tumor Types" is selected
    if (selection.find((option) => option.value === 0))
      selection = fields.cancer.slice(1);
    mergeForm({ cancer: selection });
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
          onChange={handleMultiChange}
          options={fields.cancer}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="dataset">
        <Form.Label className="required">Dataset</Form.Label>
        <Form.Select name="dataset" onBlur={handleChange} required>
          <option value="" hidden>
            No dataset selected
          </option>
          {fields.dataset.map((o) => (
            <option value={o.value} key={`dataset-${o.value}`}>
              {o.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="analysis">
        <Form.Label className="required">Analysis</Form.Label>
        <Form.Select name="analysis" onChange={handleChange} required>
          <option value="" hidden>
            No analysis selected
          </option>
          {fields.analysis.map((o) => (
            <option value={o.value} key={`analysis-${o.value}`}>
              {o.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="gene">
        <Form.Label className="required">Gene</Form.Label>
        <Form.Control
          name="gene"
          onBlur={handleChange}
          type="text"
          placeholder="No gene selected"
          list="genes"
          required
        />
        <datalist id="genes">
          {fields.gene.map((o) => (
            <option value={o.value} key={`gene-${o.value}`}>
              {o.label}
            </option>
          ))}
        </datalist>
      </Form.Group>

      <fieldset
        disabled={form.analysis !== "correlation"}
        className="border px-3 mb-4">
        <legend className="legend">Correlation</legend>

        <Form.Group className="mb-3">
          <Form.Check
            inline
            label="Tumor vs Control"
            name="correlation"
            type="radio"
            id="correlationTumorVsControl"
            value="tumorVsControl"
            checked={
              form.analysis === "correlation" &&
              form.correlation === "tumorVsControl"
            }
            onChange={handleChange}
          />

          <Form.Check
            inline
            label="Gene vs Gene"
            name="correlation"
            type="radio"
            id={`correlationGeneVsGene`}
            value="geneVsGene"
            checked={
              form.analysis === "correlation" &&
              form.correlation === "geneVsGene"
            }
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="correlated-gene">
          <Form.Label
            className={classNames(
              "required",
              (form.analysis !== "correlation" ||
                form.correlation !== "geneVsGene") &&
                "text-muted",
            )}>
            Correlated Gene
          </Form.Label>
          <Form.Control
            name="correlated-gene"
            onBlur={handleChange}
            disabled={
              form.analysis !== "correlation" ||
              form.correlation !== "geneVsGene"
            }
            type="text"
            placeholder="No gene selected"
            list="genes"
            required
          />
        </Form.Group>
      </fieldset>

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
