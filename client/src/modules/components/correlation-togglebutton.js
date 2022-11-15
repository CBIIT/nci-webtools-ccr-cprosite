import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/esm/ToggleButton";

const correlationToggleButton = ({numType, handleToggle}) => {
  return(
           <ToggleButtonGroup
            type="radio"
            name="plot-tab"
            value={numType}
            className="col-xl-6 m-3">
            <ToggleButton 
              className={numType === "log2" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
              id="log2"
              checked={numType === "log2"}
              onClick={handleToggle}>
               Using Log<sub>2</sub> values
            </ToggleButton>
            <ToggleButton 
              className={numType === "numeric" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
              id="numeric"
              checked={numType === "numeric"}
              onClick={handleToggle}>
               Using normal values converted by log<sub>2</sub> values
            </ToggleButton>
          </ToggleButtonGroup>
  );
 };

 export default correlationToggleButton;