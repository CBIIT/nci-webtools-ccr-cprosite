import { atom, selector } from "recoil";
import { query } from "../../services/query";

export const fieldsState = selector({
  key: "explore.fieldsState",
  get: ({ get }) => query("fields.json"),
});

export const defaultFormState = {
  cancer: "",
  gene: "",
  analysis: "",
  dataset: "",
  correlation: 'tumorVsControl'
};

export const formState = atom({
  key: "explore.formState",
  default: defaultFormState,
});
