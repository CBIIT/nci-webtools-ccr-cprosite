import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

export const fieldsState = selector({
  key: "explore.fieldsState",
  get: ({ get }) => query("fields.json"),
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

//Remove limits in final release

export const geneState = selector({
  key: "explore.geneState",
  get: ({ get }) => query("api/query", { table: "gene", limit: 10 }),
});

export const dataState = selectorFamily({
  key: "explore.proteinData",
  get:
    ({ table, cancer, gene }) =>
    async (_) =>
      table && cancer && gene
        ? query("/api/query", {
            "table": table,
            "_cancerId:in": cancer,
            "_geneId": gene,
          })
        : [],
});

export const defaultFormState = {
  cancer: [],
  gene: "",
  analysis: "",
  dataset: "",
  correlation: "toAnotherProtein",
  correlatedGene: "",
};

export const formState = atom({
  key: "explore.formState",
  default: defaultFormState,
});
