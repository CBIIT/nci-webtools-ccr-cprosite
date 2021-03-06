import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

export const cancerState = selector({
  key: "explore.fieldState",
  get: ({ get }) => query("api/query", { table: "cancer" }),
});

export const casesState = selector({
  key: "explore.casesState",
  get: ({ get }) => query("sampleCases.json"),
});

export const siteState = selector({
  key: "explore.siteState",
  get: ({ get }) => query("data/phosphoproteinData.json"),
});

export const proteinState = selector({
  key: "explore.proteinState",
  get: ({ get }) => query("data/proteinData.json"),
});

export const rnaState = selector({
  key: "explore.rnaState",
  get: ({ get }) => query("data/rnaData.json"),
});

export async function getData(params, tumor, gene) {
  var summary;
  if (params.dataset.value === "phosphoproteinData" || params.dataset.value === "phosphoproteinRatioData") {
    summary = await query("api/query", {
      "table": params.dataset.value + "Summary",
      "_cancerId:in": tumor,
      "_geneId": gene,
      "orderBy": "phosphorylationSite",
      "order": "asc",
    });
  } else {
    summary = await query("api/query", {
      "table": params.dataset.value + "Summary",
      "_cancerId:in": tumor,
      "_geneId": gene,
    });
  }

  const participants = await query("api/query", {
    "table": params.dataset.value,
    "_cancerId:in": tumor,
    "_geneId": gene,
  });

  if (params.correlation === "proteinMRNA") {
    const rna = await query("api/query", {
      "table": "rnaData",
      "_cancerId:in": tumor,
      "_geneId": gene,
    });

    const rnaSummary = await query("api/query", {
      "table": "rnaDataSummary",
      "_cancerId:in": tumor,
      "_geneId": gene,
    });

    return { summary, participants, rna, rnaSummary };
  } else if (params.correlation === "toAnotherProtein" && params.dataset.value !== "proteinData") {
    const protein = await query("api/query", {
      "table": "proteinData",
      "_cancerId:in": tumor,
      "_geneId": gene,
    });

    return { summary, participants, protein };
  }

  return { summary, participants };
}

export const resultsState = selector({
  key: "results",
  get: async ({ get }) => {
    const params = get(formState);
    if (!params) return null;

    var results = [];
    console.log(params);

    for (const gene of [params.gene, params.correlatedGene]) {
      if (!gene) continue;

      const { summary, participants, rna, rnaSummary, protein } = await getData(
        params,
        params.cancer.map((e) => e.value),
        gene.value,
      );
      results.push({
        gene,
        summary,
        participants,
        rnaSummary,
        rna,
        protein,
      });
    }
    console.log(results);
    return results;
  },
});

export const geneState = selector({
  key: "explore.geneState",
  get: ({ get }) => query("api/query", { table: "gene" }),
});

export const dataState = selectorFamily({
  key: "explore.proteinData",
  get:
    ({ table, cancer, gene }) =>
    async (_) =>
      table && cancer && gene
        ? query("api/query", {
            "table": table,
            "_cancerId:in": cancer,
            "_geneId": gene,
          })
        : [],
});

export const defaultFormState = {
  openSidebar: true,
  cancer: [{ value: 6, label: "Lung Adenocarcinoma" }],
  gene: { value: 1722, label: "CDK1" },
  analysis: { value: "tumor-control", label: "Tumor vs Normal Tissue Adjacent to the Tumor" },
  dataset: { value: "proteinData", label: "Relative Protein Abundance" },
  correlation: "toAnotherProtein",
  correlatedGene: "",
  submitted: false,
};

export const formState = atom({
  key: "explore.formState",
  default: defaultFormState,
});
