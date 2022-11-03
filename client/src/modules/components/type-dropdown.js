import Form from "react-bootstrap/Form";

const TypeDropdown = ({form,results, view,setView,controlid}) => {
  return(
      <div>
        <Form.Group className="row mx-3" controlId={controlid}>
         <Form.Label className="col-xl-1 col-xs-12 col-form-label" style={{ minWidth: "120px" }}>
            Tumor Type
          </Form.Label>
          <div className="col-xl-3">
            <Form.Select
              name="caseView"
              onChange={(e) => {
                setView(parseInt(e.target.value));
              }}
              value={view}
              required
            >
              {results.map((o) => (
                <option value={Number(o[0])} key={`dataset-${o[0]}`}>
                  {form.cancer.find((f) => f.value === Number(o[0])).label}
                </option>
              ))}
            </Form.Select>
          </div>
           </Form.Group>
      </div>
  );
 };

 export default TypeDropdown;