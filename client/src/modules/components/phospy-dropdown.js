import Form from "react-bootstrap/Form";
import _ from "lodash";
import Row from "react-bootstrap/esm/Row";

const PhosDropdown = ({form,sortResults,view,setView,setPhosView,setSite,controlid}) => {
  return(
    <Row>
          <Form.Label className="col-xl-1 col-xs-12 col-form-label" style={{ minWidth: "120px" }}>
            Tumor Type
          </Form.Label>
            <Form.Select className="col-xl-4 col-xs-12" style={{width: "66%"}}
              name="caseView"
              onChange={(c) => {
                setView(parseInt(c.target.value));
                const phos = sortResults.find((e) => Number(e[0]) === parseInt(c.target.value))
                  ? Object.entries(
                      _.groupBy(
                        sortResults.find((e) => Number(e[0]) === parseInt(c.target.value))[1],
                        "phosphorylationSite",
                      ),
                    ).filter((e) => e[0] !== "null")
                  : [];
                setPhosView(phos.length ? phos[0][0] : "");
                setSite(phos.length ? phos[0][1][0] : "");
              }}
              value={form.cancer.find((e) => e.value === view) ? view : form.cancer[0].value}
              required
            >
              {form.cancer.map((o) => (
                <option value={o.value} key={`dataset-${o.value}`}>
                  {o.label}
                </option>
              ))}
            </Form.Select>
          </Row>
  );
 };

 export default PhosDropdown;