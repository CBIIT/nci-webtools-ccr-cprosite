import Form from "react-bootstrap/Form";

const TypeDropdown = ({form, view, setView, controlid}) => {
  const sortedCancer = [...form.cancer].sort((a, b) => (a.label > b.label) ? 1 : -1)
  return(
          <div className="col-xl-4" style={{width: "35%"}}>
            <Form.Select
              id={controlid}
              name="caseView"
              onChange={(e) => {
                setView(parseInt(e.target.value));
              }}
              value={view}
              required
            >
            {sortedCancer.map((o) => (
                <option value={o.value} key={`dataset-${o.value}`}>
                  {o.label}
                </option>
              ))
            }
            </Form.Select>
          </div>
  );
 };

 export default TypeDropdown;