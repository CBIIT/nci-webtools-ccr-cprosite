import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Select from 'react-select';
import { useRecoilState, useRecoilValue } from "recoil";
import { fieldsState, defaultFormState } from "./explore.state";
import { useState } from "react";

export default function ExploreForm({ onSubmit, onReset }) {
  const fields = useRecoilValue(fieldsState);
  const [form, setForm] = useState(defaultFormState);
  const [cancerList, setCancerList] = useState([])
  const mergeForm = (obj) => setForm({ ...form, ...obj });

  function handleBlur(event) {
    const { name, value } = event.target;
    // todo: validate selected gene
    mergeForm({ [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (onSubmit) onSubmit(form);
  }

  function handleReset(event) {
    setForm(defaultFormState);
    if (onReset) onReset(defaultFormState);
  }

  async function handleMultiChange(option) {

    // Add all cancer types if "All Tumor Types" is selected
    if (option.length >= 1 && option[option.length-1].value === 1) {
      setCancerList( fields.cancer.slice(1) )
      await mergeForm({ ['cancer']: fields.cancer.slice(1) })
    }
    else {
      setCancerList(option)
      await mergeForm({ ['cancer']: option })
    }
  }

  return (
    <Form onSubmit={handleSubmit} onReset={handleReset}>
      <Form.Group className="mb-3" controlId="cancer">
        <Form.Label className="required">Cancer</Form.Label>
        <Select placeholder="No cancer selected" name="cancer" isMulti='true' value={cancerList} onChange={handleMultiChange} options={fields.cancer} />

      </Form.Group>

      <Form.Group className="mb-3" controlId="dataset">
        <Form.Label className="required">Dataset</Form.Label>
        <Form.Select name="dataset" onBlur={handleBlur} required>
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
        <Form.Select name='analysis' onBlur={handleBlur} required>
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
          onBlur={handleBlur}
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
