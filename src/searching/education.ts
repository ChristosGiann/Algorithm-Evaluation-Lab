import type { EducationalText } from "../education/content";
import type { SearchingAlgorithm, SearchingInput, SearchingTrace } from "./evaluation";

interface SearchingEducation {
  education: { el: EducationalText; en: EducationalText };
  walkthrough: { input: SearchingInput; expected: SearchingTrace };
}
const input: SearchingInput = { values: [1, 3, 5, 7, 9, 11, 13, 15], target: 11 };
const common = {
  el: {
    pitfalls: "Τα indexes ξεκινούν από το 0 στην αρχική συλλογή. Στα duplicates επιτρέπεται οποιοδήποτε match. Empty input ή απουσία target επιστρέφει null, όχι -1. Κάθε επαναλαμβανόμενο probe μετρά ξανά· οι comparisons μετρούν ελέγχους τιμής/target, όχι loop checks.",
    completeness: "Σε έγκυρο input που ικανοποιεί τις προϋποθέσεις τερματίζει και βρίσκει match αν υπάρχει. Η αναζήτηση δεν μεταβάλλει τη συλλογή.",
  },
  en: {
    pitfalls: "Indexes are zero-based positions in the original collection. Any matching duplicate is valid. Empty input or an absent target returns null, not -1. Repeated probes count again; comparisons count value/target checks, not loop checks.",
    completeness: "On valid input satisfying the preconditions, terminates and finds a match if one exists. Search does not mutate the collection.",
  },
};
function prerequisites(sorted: boolean, language: "el" | "en") {
  return {
    id: "preconditions", title: language === "el" ? "Προϋποθέσεις" : "Preconditions",
    paragraphs: [language === "el"
      ? "0–10.000 finite αριθμοί και finite numeric target, με αρνητικούς, δεκαδικούς και duplicates. " + (sorted ? "Απαιτείται αύξουσα (non-decreasing) σειρά. Το evaluation απορρίπτει unsorted input πριν από το timing· δεν κάνει automatic sorting." : "Δεν απαιτείται ταξινόμηση: επιτρέπεται οποιαδήποτε σειρά.")
      : "0–10,000 finite numbers and a finite numeric target, including negatives, fractions and duplicates. " + (sorted ? "Ascending (non-decreasing) order is required. Evaluation rejects unsorted input before timing; it does not sort automatically." : "No sorting is required: any order is allowed.")],
  };
}

/** Versioned examples are checked against the executable registry in tests, never run during rendering. */
export const SEARCHING_EDUCATION = {
  linear: {
    education: {
      el: { ...common.el,
        what: "Ο Linear Search ελέγχει διαδοχικά κάθε τιμή μέχρι να βρει το target.",
        intuition: "Διαβάζεις μία λίστα από αριστερά προς τα δεξιά, χωρίς να υποθέτεις κάποια σειρά.",
        how: ["Ξεκινά στο index 0.", "Κάνει μία equality comparison ανά θέση και επιστρέφει αμέσως το πρώτο match.", "Αν τελειώσει η συλλογή, επιστρέφει null."],
        complexity: "Best O(1), worst O(n) χρόνος αναζήτησης. O(1) algorithm state και έως O(n) επιπλέον probe trace στην εφαρμογή. n: πλήθος στοιχείων. Το input snapshot/validation είναι O(n) και γίνεται εκτός timing.",
        strengths: "Απλός και λειτουργεί σε unsorted data χωρίς preprocessing.",
        weaknesses: "Για target στο τέλος ή absent target μπορεί να διαβάσει όλες τις τιμές.",
        uses: "Μικρές ή μη ταξινομημένες συλλογές και αναζητήσεις χωρίς διαθέσιμη sorted δομή.",
        sections: [prerequisites(false, "el")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11.", "Ελέγχει indexes 0, 1, 2, 3, 4, 5 με αυτή τη σειρά.", "Στο index 5 βρίσκει το 11: 6 probes και 6 comparisons. Η συγκεκριμένη implementation επιστρέφει το πρώτο duplicate match."] },
      en: { ...common.en,
        what: "Linear Search checks values in sequence until it finds the target.",
        intuition: "Read a list from left to right without assuming any ordering.",
        how: ["Start at index 0.", "Perform one equality comparison per position and immediately return the first match.", "Return null when the collection is exhausted."],
        complexity: "Best O(1), worst O(n) search time. O(1) algorithm state plus up to O(n) probe trace in this application. n: item count. Input snapshot/validation is O(n), outside timing.",
        strengths: "Simple and works on unsorted data without preprocessing.",
        weaknesses: "A target at the end or an absent target may require reading every value.",
        uses: "Small or unsorted collections and lookups without an available sorted structure.",
        sections: [prerequisites(false, "en")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11.", "Check indexes 0, 1, 2, 3, 4, 5 in that order.", "Find 11 at index 5: 6 probes and 6 comparisons. This implementation returns the first duplicate match."] },
    },
    walkthrough: { input, expected: { index: 5, probes: [0,1,2,3,4,5], comparisons: 6 } },
  },
  binary: {
    education: {
      el: { ...common.el,
        what: "Ο Binary Search περιορίζει το ταξινομημένο εύρος περίπου στο μισό σε κάθε βήμα.",
        intuition: "Σύγκρινε το target με τη μέση τιμή και κράτησε μόνο την πλευρά όπου μπορεί να βρίσκεται.",
        how: ["Ορίζει inclusive low=0 και high=n−1.", "Ελέγχει το lower midpoint. Αν είναι ίσο με target, επιστρέφει το index.", "Αλλιώς κάνει less-than comparison: μετακινεί low=mid+1 ή high=mid−1. Αν low>high, επιστρέφει null."],
        complexity: "Best O(1), worst O(log n) χρόνος αναζήτησης. O(1) iterative state συν O(log n) probe trace. n: πλήθος στοιχείων. Το O(n) snapshot/sortedness validation είναι εκτός search timing· δεν είναι δωρεάν.",
        strengths: "Μειώνει γρήγορα τα υποψήφια indexes σε sorted array με άμεση πρόσβαση.",
        weaknesses: "Απαιτεί sorted data και random access. Το κόστος αρχικής ταξινόμησης δεν περιλαμβάνεται στην αναζήτηση.",
        uses: "Επαναλαμβανόμενα lookups σε ήδη ταξινομημένα arrays.",
        sections: [prerequisites(true, "el")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11, range [0,7].", "Midpoint 3 → 7: equality αποτυγχάνει, 7<11, άρα range [4,7].", "Midpoint 5 → 11: match. Probes [3,5], 3 comparisons. Δεν εγγυάται το πρώτο duplicate index."] },
      en: { ...common.en,
        what: "Binary Search roughly halves the sorted search range at each step.",
        intuition: "Compare the target with the middle value and keep only the side that can contain it.",
        how: ["Set inclusive low=0 and high=n−1.", "Inspect the lower midpoint. Return its index if it equals the target.", "Otherwise perform a less-than comparison: move low=mid+1 or high=mid−1. Return null when low>high."],
        complexity: "Best O(1), worst O(log n) search time. O(1) iterative state plus O(log n) probe trace. n: item count. O(n) snapshot/sortedness validation is outside search timing, but still has a cost.",
        strengths: "Quickly reduces candidate indexes in a sorted random-access array.",
        weaknesses: "Requires sorted data and random access. Initial sorting cost is not part of search time.",
        uses: "Repeated lookups in arrays that are already sorted.",
        sections: [prerequisites(true, "en")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11, range [0,7].", "Midpoint 3 → 7: equality fails, 7<11, so the range becomes [4,7].", "Midpoint 5 → 11: match. Probes [3,5], 3 comparisons. The first duplicate index is not guaranteed."] },
    },
    walkthrough: { input, expected: { index: 5, probes: [3,5], comparisons: 3 } },
  },
  jump: {
    education: {
      el: { ...common.el,
        what: "Ο Jump Search ελέγχει άκρα blocks και μετά σαρώνει γραμμικά το πρώτο πιθανό block.",
        intuition: "Πήδα ανά ομάδες σε ταξινομημένη λίστα και ψάξε αναλυτικά μόνο στην κατάλληλη ομάδα.",
        how: ["Επιλέγει step=max(1,floor(√n)).", "Συγκρίνει κάθε block end με target. Όσο είναι μικρότερο, πηγαίνει στο επόμενο block.", "Στο πρώτο end≥target σαρώνει όλο το block από αριστερά με equality checks μέχρι match ή εξάντληση. Αν δεν βρει target, επιστρέφει null."],
        complexity: "Worst O(√n) search χρόνος με blocks περίπου √n. O(1) state συν O(√n) probe trace. n: πλήθος στοιχείων. O(n) snapshot/sortedness validation εκτός timing. Δεν αποτελεί απόδειξη ότι είναι ταχύτερος από Binary.",
        strengths: "Συνδυάζει λίγα block probes με απλή διαδοχική σάρωση.",
        weaknesses: "Περισσότερα worst-case probes από Binary σε random-access arrays· απαιτεί ταξινόμηση και κατάλληλο block size.",
        uses: "Εκπαιδευτική σύγκριση block search και linear scan σε sorted arrays.",
        sections: [prerequisites(true, "el")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11. n=8, step=2.", "Block ends: index 1 → 3, 3 → 7, 5 → 11. Σταματά στο block [4,5].", "Scan 4 → 9, 5 → 11: match index 5. Probes [1,3,5,4,5], 5 comparisons. Το end 5 ελέγχεται ξανά και μετρά δεύτερη φορά."] },
      en: { ...common.en,
        what: "Jump Search probes block ends, then linearly scans the first candidate block.",
        intuition: "Skip groups in a sorted list, then inspect the relevant group in detail.",
        how: ["Choose step=max(1,floor(√n)).", "Compare each block end with the target. Move to the next block while it is smaller.", "At the first end≥target, scan the block left to right with equality checks until a match or exhaustion. Return null if absent."],
        complexity: "Worst O(√n) search time with blocks of about √n. O(1) state plus O(√n) probe trace. n: item count. O(n) snapshot/sortedness validation is outside timing. This does not prove it faster than Binary.",
        strengths: "Combines a few block probes with a simple sequential scan.",
        weaknesses: "More worst-case probes than Binary on random-access arrays; requires sorted data and a suitable block size.",
        uses: "Educational comparison of block search and linear scanning on sorted arrays.",
        sections: [prerequisites(true, "en")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11. n=8, step=2.", "Block ends: index 1 → 3, 3 → 7, 5 → 11. Stop at block [4,5].", "Scan 4 → 9, 5 → 11: match index 5. Probes [1,3,5,4,5], 5 comparisons. End 5 is inspected again and counted twice."] },
    },
    walkthrough: { input, expected: { index: 5, probes: [1,3,5,4,5], comparisons: 5 } },
  },
  exponential: {
    education: {
      el: { ...common.el,
        what: "Ο Exponential Search διπλασιάζει ένα όριο και μετά εκτελεί Binary Search στο περιορισμένο εύρος.",
        intuition: "Μεγάλωσε γρήγορα το εύρος μέχρι να περικλείσεις το target και έπειτα αναζήτησε με midpoint probes.",
        how: ["Ελέγχει equality στο index 0· empty input επιστρέφει null.", "Δοκιμάζει bounds 1,2,4,… με comparison value≥target, μέχρι να βρει όριο ή να φτάσει εκτός array.", "Κάνει inclusive Binary Search από floor(bound/2) έως min(bound,n−1), με equality και μετά order check σε κάθε mismatch."],
        complexity: "Best O(1), worst O(log n) χρόνος αναζήτησης, O(1) state συν O(log n) probe trace. n: πλήθος στοιχείων. O(n) snapshot/sortedness validation εκτός timing. Κοντινό target μπορεί να περιορίσει νωρίς την επέκταση.",
        strengths: "Η αναζήτηση εύρους προσαρμόζεται στη θέση του target, πριν από τη binary phase.",
        weaknesses: "Απαιτεί sorted data και προσθέτει expansion probes. Δεν είναι πάντα ταχύτερος από Binary.",
        uses: "Sorted lookups με ενδιαφέρον για targets κοντά στην αρχή. Εδώ δουλεύει σε πεπερασμένο array, όχι σε stream.",
        sections: [prerequisites(true, "el")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11.", "Probes 0,1,2,4 έχουν τιμές 1,3,5,9. Το επόμενο bound=8 είναι εκτός array, άρα binary range [4,7].", "Midpoint 5 → 11: match. Probes [0,1,2,4,5], 5 comparisons. Το bound εκτός array δεν διαβάζεται ούτε μετρά ως probe."] },
      en: { ...common.en,
        what: "Exponential Search doubles a bound, then runs Binary Search in the narrowed range.",
        intuition: "Expand the range quickly until it encloses the target, then search with midpoint probes.",
        how: ["Check equality at index 0; empty input returns null.", "Try bounds 1,2,4,… with a value≥target comparison until a bound is found or lies outside the array.", "Run inclusive Binary Search from floor(bound/2) to min(bound,n−1), using equality then an order check on each mismatch."],
        complexity: "Best O(1), worst O(log n) search time, O(1) state plus O(log n) probe trace. n: item count. O(n) snapshot/sortedness validation is outside timing. A nearby target may stop expansion early.",
        strengths: "Range discovery adapts to the target position before the binary phase.",
        weaknesses: "Requires sorted data and adds expansion probes. It is not always faster than Binary.",
        uses: "Sorted lookups with interest in targets near the beginning. This implementation uses a finite array, not a stream.",
        sections: [prerequisites(true, "en")],
        example: ["[1, 3, 5, 7, 9, 11, 13, 15], target=11.", "Probes 0,1,2,4 read 1,3,5,9. The next bound=8 is outside the array, so the binary range is [4,7].", "Midpoint 5 → 11: match. Probes [0,1,2,4,5], 5 comparisons. The out-of-array bound is neither read nor counted as a probe."] },
    },
    walkthrough: { input, expected: { index: 5, probes: [0,1,2,4,5], comparisons: 5 } },
  },
} satisfies Record<SearchingAlgorithm, SearchingEducation>;
