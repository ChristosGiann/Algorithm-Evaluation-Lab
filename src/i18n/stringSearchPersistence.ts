export const stringSearchPersistenceTexts = {
  el: {
    name: "Όνομα string-search πειράματος", save: "Αποθήκευση αποτελέσματος", saving: "Αποθήκευση…",
    saved: "Αποθηκεύτηκε. Άνοιξέ το από το ιστορικό με ανανέωση λίστας ή ID:",
    error: "Η αποθήκευση δεν επιβεβαιώθηκε. Έλεγξε πρώτα το ιστορικό πριν ξαναδοκιμάσεις.",
    note: "Αποθηκευμένο browser snapshot. Άνοιγμα χωρίς νέο run. Οι χρόνοι και τα counters δεν επαληθεύονται με εκτέλεση στον server.",
    input: "Αποθηκευμένα text, pattern και mode", selected: "Επιλεγμένοι algorithms", trace: "Αποθηκευμένα alignment offsets",
  },
  en: {
    name: "String-search experiment name", save: "Save result", saving: "Saving…",
    saved: "Saved. Open from history after refreshing its list, or by ID:",
    error: "Save was not confirmed. Check history before retrying.",
    note: "Saved browser snapshot. Opening does not rerun searches. Timings and counters are not verified by server execution.",
    input: "Saved text, pattern and mode", selected: "Selected algorithms", trace: "Saved alignment offsets",
  },
} as const;
