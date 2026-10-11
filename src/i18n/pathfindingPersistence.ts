export const pathfindingPersistenceTexts = {
  el: {
    name: "Όνομα pathfinding πειράματος", save: "Αποθήκευση αποτελέσματος", saving: "Αποθήκευση…",
    saved: "Αποθηκεύτηκε. Άνοιξέ το από το κοινό ιστορικό πειραμάτων με ανανέωση λίστας ή ID:",
    error: "Η αποθήκευση δεν επιβεβαιώθηκε. Έλεγξε πρώτα το ιστορικό πριν ξαναδοκιμάσεις.",
    note: "Αποθηκευμένο snapshot από τον browser. Άνοιγμα χωρίς νέο run· οι χρόνοι δεν επαληθεύονται από τον server.",
    grid: "Αποθηκευμένο grid", legend: "IDs ανά γραμμή από 0. S: start, E: end, #: wall. Οι αριθμοί είναι costs· start δεν χρεώνεται.",
    route: "Αποθηκευμένες διαδρομές (cell IDs)", noPath: "Δεν υπάρχει διαδρομή", selected: "Επιλεγμένοι algorithms",
  },
  en: {
    name: "Pathfinding experiment name", save: "Save result", saving: "Saving…",
    saved: "Saved. Open from the shared experiment history after refreshing its list, or by ID:",
    error: "Save was not confirmed. Check history before retrying.",
    note: "Saved browser snapshot. Opening does not rerun searches; timings are not verified by the server.",
    grid: "Saved grid", legend: "Row-major IDs from 0. S: start, E: end, #: wall. Numbers are costs; start is not charged.",
    route: "Saved paths (cell IDs)", noPath: "No path", selected: "Selected algorithms",
  },
} as const;
