import Form from "react-bootstrap/Form";

const TypeDropdown = ({form,results, view,setView,controlid}) => {
  return(
          <div className="col-xl-4" style={{width: "35%"}}>
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
  );
 };

 export default TypeDropdown;