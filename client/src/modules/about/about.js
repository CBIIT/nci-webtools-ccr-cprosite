import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";

export default function About() {
  return (
    <Container className="my-4">
      <Card className="shadow">
        <Card.Body>
          <h1>About CPTAC Search</h1>

          <hr />

          <p>
            The Cancer Proteogenomic Data Analysis Site (cProSite) is a
            web-based interactive platform that provides on-line proteomic and
            phosphoproteomic analysis for the data of the National Cancer
            Institute’s Clinical Proteomic Tumor Analysis Consortium (CPTAC,
            https://proteomics.cancer.gov). The platform has advantages compared
            to regular analytical methods: 1) Faster on-line analysis; 2) More
            user-friendly environment; and 3) Less need for bioinformatics
            expertise to perform the analysis. cProSite currently includes 10
            tumor types (breast cancer, colon cancer, head and neck cancer,
            liver cancer, lung adenocarcinoma (Lung AD), lung squamous carcinoma
            (Lung SC), ovarian cancer, stomach cancer and uterine cancer). The
            cProSite Dataset will be updated with the new CPTAC release.
          </p>

          <p>
            Features of cProSite include: 1) Comparing selected protein
            abundance between tumors and normal adjacent tissues and show
            protein abundance fold-changes between paired tumor and control
            cases; 2) Comparing selected levels of individual phosphorylation
            sites or levels of phosphorylation site per protein abundance and
            show fold-changes between tumors and normal adjacent tissues; 3)
            Correlating protein abundance, phosphorylation site levels, or
            phosphorylation site level per protein abundance between two
            selected proteins; 4) Correlating selected protein abundance with
            its mRNA expression level if the data are available. cProSite allows
            users to download the analyzed data through its export feature.
          </p>

          <p>
            The data from cProSite are derived from the Proteomic Data Commons
            (PDC, https://proteomic.datacommons.cancer.gov/pdc/) and the CPTAC
            portal (https://proteomics.cancer.gov/data-portal). Because of the
            limitations of mass spectrometry and the analytic algorithms, not
            all proteins and all phosohorylation sites are detected for
            individual samples.
          </p>

          <p>
            Please submit comments and questions regarding cProSite analysis to
            the cProSite team (XXXX).
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
