import Form from "react-bootstrap/Form";

const TypeDropdown = ({form,results, view,setView,controlid}) => {
  let sortedCancer = [...form.cancer]
  sortedCancer = sortedCancer.sort((a,b)=> (a.label>b.label)?1:-1)
  //console.log(view);
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

            {
             sortedCancer.map((o) => (
                <option value={o.value} key={`dataset-${o.value}`}>
                  {o.label}
                </option>
              ))
            }

              {/* {results.map((o) => (
                <option value={Number(o[0])} key={`dataset-${o[0]}`}>
                  {form.cancer.find((f) => f.value === Number(o[0])).label}
                </option>
              ))} */}
            </Form.Select>
          </div>
  );
 };

 export default TypeDropdown;