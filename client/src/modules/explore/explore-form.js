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
  // const [form, setForm] = useState(defaultFormState);

  const mergeForm = (obj) => setForm({ ...form, ...obj });

  const genes = useRecoilValue(geneState).records.map((e) => {
    return { value: e.id, label: e.name };
  });

  const tumors = [{ value: 0, label: "All Tumor Types" }].concat(cancer.records.map((e) => {
    return { value: e.id, label: e.name, singlePool: e.singlePool };
  }));

  const defaultForm = {
    openSidebar: true,
    // cancer: [{ value: 6, label: "Lung Adenocarcinoma" }],
    cancer: cancer.records.map((e) => {
      return { value: e.id, label: e.name, singlePool: e.singlePool };
    }),
    gene: { value: 1722, label: "CDK1" },
    analysis: { value: "tumor-control", label: "Tumor vs Normal Tissue" },
    dataset: { value: "proteinData", label: "Relative Protein Abundance" },
    correlation: "toAnotherProtein",
    correlatedGene: "",
    submitted: false,
  };
  
  const [form, setForm] = useState(defaultForm);
  function handleChange(event) {
    const { name, value } = event.target;
    // todo: validate selected gene
    mergeForm({ [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    
    if (form.cancer[0].value === 0) {
      if (onSubmit) onSubmit({...form, cancer: tumors.slice(1)});
    } else {
      if (onSubmit) onSubmit(form);
    }
    // selection.sort((a,b) => a.label.localeCompare(b.label))
    // console.log(selection)
    
  }

  function handleReset(event) {
    event.preventDefault();
    // setForm(defaultFormState);
    // if (onReset) onReset(defaultFormState);
    setForm(defaultForm);
    if (onReset) onReset(defaultForm);
  }

  function handleSelectChange(name, selection = []) {
    // var ifBrain = -1;
    // var ifBrainFirst= false;
    // var ifAll = -1;
    // //const excludeType = "Breast Cancer"
    // const excludeType = "Brain Cancer"
    // if (selection.length > 0){
    //   ifBrain = selection.findIndex(s => s.label === excludeType )
    //   ifBrainFirst = selection[0].label === excludeType
    //   ifAll = selection.findIndex(s => s.label === "All Tumor Types")
    //   console.log(ifBrain,selection,ifBrainFirst,ifAll)
    // }
    // if (name === "cancer" && selection.find((option) => option.value === 0)) {
    //   selection = tumors.slice(1)
    // }
    // if (ifBrain > -1 && ifBrainFirst) selection = selection.filter(option => option.label.includes(excludeType))
    // if ((ifBrain > -1 && !ifBrainFirst) || ifAll > -1) selection = selection.filter(option => !option.label.includes(excludeType))

    //try to exclude a specific cancer if select all types
    //selection = selection.filter(option => !option.label.includes("Breast"))
    if (name === "cancer" && selection.find((option) => option.value === 0)) {
      selection = tumors.slice(1)
    }
    // selection.sort((a,b) => a.label.localeCompare(b.label))
    // console.log(selection)
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
    if (form.analysis.value === "correlation" && (form.correlation === "toAnotherProtein" || form.correlation === "toAnotherMRNA") && !form.correlatedGene)
      return false;

    return form.cancer && form.dataset && form.analysis && form.gene;
  }

  return (
    <Form onSubmit={handleSubmit} onReset={handleReset}>
      <Form.Group className="mb-3" controlId="cancer">
        <Form.Label className="required">Tumor Types</Form.Label>
        <Select
          placeholder="No cancer selected"
          name="cancer"
          isMulti={true}
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
              (e.value === "proteinData" || e.value === "phosphoproteinData" || e.value === "phosphoproteinRatioData")
            ) {
              mergeForm({
                ["dataset"]: e,
                ["correlation"]: "toAnotherProtein",
                // ["correlatedGene"]: "",
                
              });
            }
            else if (form.analysis.value === "correlation" && e.value === "rnaLevel") {
              mergeForm({
                ["dataset"]: e,
                ["correlation"]: "toAnotherMRNA",
                // ["correlatedGene"]: "",
                
              });
            }
            else handleSelectChange("dataset", e);
          }}
          options={[
            { value: "proteinData", label: "Relative Protein Abundance" },
            { value: "phosphoproteinData", label: "Phosphorylation Site" },
            {
              value: "phosphoproteinRatioData",
              label: "Phosphorylation/Protein",
            },
            { value: "rnaLevel", label: "RNA Level" }
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
            { value: "tumor-control", label: "Tumor vs Normal Tissue" },
            { value: "correlation", label: "Correlation" },
          ]}
          onChange={(e) => {
            if (e.value === "tumor-control")
              mergeForm({
                ["correlatedGene"]: "",
                ["correlation"]: "toAnotherProtein",
                ["analysis"]: e,
              });
            else if (form.dataset.value !== "rnaLevel" && e.value === "correlation") {
              mergeForm({
                ["correlatedGene"]: "",
                ["correlation"]: "toAnotherProtein",
                ["analysis"]: e,
              });
            }
            else if (form.dataset.value === "rnaLevel" && e.value === "correlation") {
              mergeForm({
                ["correlatedGene"]: "",
                ["correlation"]: "toAnotherMRNA",
                ["analysis"]: e,
              });
            }
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
            {form.dataset.value !== "rnaLevel" && <Form.Check
              inline
              label="To Another Protein"
              name="correlation"
              type="radio"
              id="correlationToAnotherProtein"
              value="toAnotherProtein"
              checked={form.analysis.value === "correlation" && form.correlation === "toAnotherProtein"}
              onChange={handleChange}
            />}

            {form.dataset.value === "rnaLevel" && <Form.Check
              inline
              label="mRNA to Another mRNA"
              name="correlation"
              type="radio"
              id="correlationToAnotherMRNA"
              value="toAnotherMRNA"
              checked={form.analysis.value === "correlation" && form.correlation === "toAnotherMRNA"}
              onChange={handleChange}
            />}



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

          {(form.correlation === "toAnotherProtein" || form.correlation === "toAnotherMRNA") && (
            <Form.Group className="mb-3" controlId="correlated-gene">
              <Form.Label
                className={classNames(
                  "required",
                  (form.analysis.value !== "correlation" || form.correlation !== "toAnotherProtein"),
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
