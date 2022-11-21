import Form from "react-bootstrap/Form";

const TypeDropdownCorrelation = ({form, view,setView,setLabel}) => {
  let sortedCancer = [...form.cancer]
  sortedCancer = sortedCancer.sort((a,b)=> (a.label>b.label)?1:-1)
  return(
            <Form.Select
                name="caseView"
                onChange={(e) => {
                  if (e.target.value === "all") {
                    setView(form.cancer.map((e) => e.value));
                    setLabel("");
                  } else {
                    setView([parseInt(e.target.value)]);
                    setLabel(form.cancer.find((d) => d.value === parseInt(e.target.value)).label);
                  }
                }}
                value={view}
                required>
                {form.cancer.length > 1 && (
                  <option value="all" key={`dataset-all`}>
                    All Selected Tumor Types
                  </option>
                )}
                {sortedCancer.map((o) => (
                  <option value={o.value} key={`dataset-${o.value}`}>
                    {o.label}
                  </option>
                ))}
            </Form.Select>
  );
 };

 export default TypeDropdownCorrelation;