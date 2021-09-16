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
  const summary = await query("api/query", {
    "table": params.dataset.value + "Summary",
    "_cancerId:in": tumor,
    "_geneId": gene,
  });

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
  } else return { summary, participants };
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

      const { summary, participants, rna, rnaSummary } = await getData(
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
  cancer: [{ value: 1, label: "Breast Cancer" }],
  gene: { value: 1722, label: "CDK1" },
  analysis: { value: "tumor-control", label: "Tumor vs Adjacent Normal" },
  dataset: { value: "proteinData", label: "Protein Abundance" },
  correlation: "toAnotherProtein",
  correlatedGene: "",
};

export const formState = atom({
  key: "explore.formState",
  default: defaultFormState,
});
