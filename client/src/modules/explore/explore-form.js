import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useRecoilState, useRecoilValue } from "recoil";
import { fieldsState, defaultFormState } from "./explore.state";
import { useState } from "react";

export default function ExploreForm({ onSubmit, onReset }) {
  const fields = useRecoilValue(fieldsState);
  const [form, setForm] = useState(defaultFormState);
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

  return (
    <Form onSubmit={handleSubmit} onReset={handleReset}>
      <Form.Group className="mb-3" controlId="cancer">
        <Form.Label className="required">Cancer</Form.Label>
        <Form.Select onBlur={handleBlur} required>
          <option value="" hidden>
            No cancer selected
          </option>
          {fields.cancer.map((o) => (
            <option value={o.value} key={`cancer-${o.value}`}>
              {o.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="gene">
        <Form.Label className="required">Gene</Form.Label>
        <Form.Control
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
