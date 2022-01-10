import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";

export default function About() {
  return (
    <Container className="my-4">
      <Card className="shadow">
        <Card.Body>
          <h3>About cProSite</h3>

          <hr />

          <p>
            The <b>C</b>ancer <b>Pro</b>teogenomic Data Analysis <b>Site</b>{" "}
            (cProSite) is a web-based interactive platform that provides
            visualization of proteomic and phosphoproteomic analysis of the
            datasets of the{" "}
            <a
              target="_blank"
              href="https://proteomics.cancer.gov"
              style={{ fontWeight: "bold" }}>
              National Cancer Institute’s Clinical Proteomic Tumor Analysis
              Consortium
            </a>{" "}
            (CPTAC) and{" "}
            <a
              target="_blank"
              href="https://proteomics.cancer.gov/programs/international-cancer-proteogenome-consortium"
              style={{ fontWeight: "bold" }}>
              National Cancer Institute’s International Cancer Proteogenome
              Consortium
            </a>{" "}
            (ICPC).
          </p>
          <p>
            The platform has advantages compared to the other analytical
            methods:
          </p>
          <ul style={{ listStyle: "none" }}>
            <li>1) Fast online application.</li>
            <li>
              2) More user-friendly environment for researchers without
              bioinformatics expertise.
            </li>
            <li>
              3) Multiple tumor types available. cProSite currently includes 11
              tumor types (breast cancer, colon cancer, head and neck cancer,
              liver cancer, lung adenocarcinoma (Lung AD), lung squamous
              carcinoma (Lung SC), ovarian cancer, pancreatic ductal
              adenocarcinoma, stomach cancer and uterine cancer). The datasets
              will be expanded with newly released data.
            </li>
          </ul>

          <p>
            Features of cProSite include:
            <ul style={{ listStyle: "none" }}>
              <li>
                1) Comparing selected protein abundance between tumors and
                normal adjacent tissues and showing protein abundance
                fold-changes between paired tumor and control cases.
              </li>
              <li>
                2) Comparing selected levels of individual phosphorylation sites
                or levels of phosphorylation site per protein abundance
                (normalized protein phosphorylation level) and showing
                fold-changes between tumors and normal adjacent tissues.
              </li>
              <li>
                3) Correlating protein abundance, phosphorylation site levels,
                or phosphorylation site level per protein abundance between two
                selected proteins.
              </li>
              <li>
                4) Correlating selected protein abundance with its mRNA
                expression level if the data are available.
              </li>
              <li>
                5) Allowing users to download the analyzed data through its
                export feature.
              </li>
            </ul>
          </p>

          <p>
            The data from cProSite are derived from the{" "}
            <a
              target="_blank"
              href="https://proteomic.datacommons.cancer.gov/pdc/"
              style={{ fontWeight: "bold" }}>
              Proteomic Data Commons
            </a>{" "}
            (PDC). Because of the limitations of mass spectrometry and the
            analytic algorithms, not all proteins and all phosohorylation sites
            are detected for individual samples.
          </p>

          <p>
            Please submit comments and questions regarding cProSite to{" "}
            <a
              href="mailto:NCIcProSiteWebAdmin@mail.nih.gov"
              style={{ fontWeight: "bold" }}>
              NCIcProSiteWebAdmin@mail.nih.gov
            </a>
            .
          </p>

          <p>
            If you use cProSite for your analysis, please cite: cProSite: A web
            based interactive platform for on-line proteomics and
            phosphoproteomics data analysis. https://cprosite.ccr.cancer.gov
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
