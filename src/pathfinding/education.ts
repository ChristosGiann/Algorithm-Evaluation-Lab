import type { EducationalText } from "../types/algorithm";
import type { GridInput } from "./evaluation";
import type { AvailablePathfindingAlgorithm } from "./registry";

interface PathfindingEducation {
  name: string;
  education: { el: EducationalText; en: EducationalText };
  walkthrough: { input: GridInput; path: number[]; cost: number };
}

const common = {
  el: {
    completeness: "Σε έγκυρο, πεπερασμένο grid βρίσκει διαδρομή αν υπάρχει· διαφορετικά τερματίζει με no-path.",
    pitfalls: "Κίνηση μόνο πάνω/δεξιά/κάτω/αριστερά, χωρίς diagonals. Τα walls αποκλείονται. Το κόστος χρεώνεται κατά την είσοδο σε cell, χωρίς το start. Τα visited δεν είναι η τελική διαδρομή. Τα ties ακολουθούν deterministic σειρά.",
  },
  en: {
    completeness: "On a valid finite grid, finds a route if one exists; otherwise terminates with no-path.",
    pitfalls: "Movement is up/right/down/left, without diagonals. Walls are excluded. Cost is charged on entering a cell, excluding the start. Visited cells are not the final path. Ties follow deterministic ordering.",
  },
};
const uniform: GridInput = { rows: 2, cols: 3, start: 0, end: 3, walls: Array(6).fill(false) };
const weighted: GridInput = { rows: 2, cols: 3, start: 0, end: 2, walls: Array(6).fill(false), costs: [1,5,1,1,1,1] };
const linear = {
  el: "O(V+E) χρόνος και O(V+E) βοηθητικός χώρος. V: cells, E: γειτονικές συνδέσεις· στο cardinal grid E≤4V, άρα O(V).",
  en: "O(V+E) time and O(V+E) auxiliary space. V: cells, E: neighbour connections; on a cardinal grid E≤4V, hence O(V).",
};
const heap = {
  el: "Worst-case O((V+E) log V) χρόνος και O(V+E) βοηθητικός χώρος με το binary heap της εφαρμογής. V: cells, E: γειτονικές συνδέσεις (E≤4V).",
  en: "Worst-case O((V+E) log V) time and O(V+E) auxiliary space with this application's binary heap. V: cells, E: neighbour connections (E≤4V).",
};

/** Curated, versioned metadata keyed by the executable domain registry. */
export const PATHFINDING_EDUCATION = {
  bfs: {
    name: "BFS",
    education: {
      el: { ...common.el,
        what: "Breadth-first search: εξερευνά το grid ανά επίπεδο απόστασης.",
        intuition: "Ένα κύμα απλώνεται ένα βήμα κάθε φορά.",
        how: ["Βάζει το start σε FIFO queue.", "Αφαιρεί το παλιότερο cell και προσθέτει μη ανακαλυμμένους γείτονες.", "Στο end ανακατασκευάζει τη διαδρομή από parents."],
        strengths: "Απλός τρόπος εύρεσης διαδρομής με τα λιγότερα βήματα.",
        weaknesses: "Η frontier μπορεί να μεγαλώσει πολύ και δεν λαμβάνει υπόψη terrain costs.",
        uses: "Unweighted mazes και ελάχιστος αριθμός κινήσεων.",
        optimality: "Ελάχιστα βήματα. Ελάχιστο κόστος μόνο όταν κάθε βήμα έχει το ίδιο κόστος.",
        weights: "Δέχεται weighted grid, αλλά αγνοεί τα weights κατά την αναζήτηση.",
        complexity: linear.el,
        example: ["Grid 2×3, IDs ανά γραμμή: [0,1,2] / [3,4,5]. Χωρίς walls, unit costs, start=0, end=3.", "Μετά το 0, η queue είναι [1,3]. Επεξεργάζεται το 1 πριν από το 3.", "Η διαδρομή είναι 0 → 3: 1 βήμα, κόστος 1."] },
      en: { ...common.en,
        what: "Breadth-first search explores the grid by distance layers.",
        intuition: "A wave expands one step at a time.",
        how: ["Put the start in a FIFO queue.", "Remove the oldest cell and enqueue undiscovered neighbours.", "At the end, reconstruct the route through parents."],
        strengths: "A simple way to find the fewest-step route.",
        weaknesses: "The frontier can grow large and terrain costs are ignored.",
        uses: "Unweighted mazes and minimum move counts.",
        optimality: "Minimum steps. Minimum cost only when every step has the same cost.",
        weights: "Accepts weighted grids but ignores weights during search.",
        complexity: linear.en,
        example: ["2×3 grid, row-major IDs: [0,1,2] / [3,4,5]. No walls, unit costs, start=0, end=3.", "After 0, the queue is [1,3]. Cell 1 is processed before 3.", "The path is 0 → 3: 1 step, cost 1."] },
    },
    walkthrough: { input: uniform, path: [0,3], cost: 1 },
  },
  dfs: {
    name: "DFS",
    education: {
      el: { ...common.el,
        what: "Depth-first search: ακολουθεί έναν κλάδο πριν επιστρέψει στις εναλλακτικές.",
        intuition: "Προχωρά όσο βαθύτερα μπορεί και μετά κάνει backtrack.",
        how: ["Βάζει το start σε LIFO stack.", "Επεξεργάζεται το τελευταίο cell, προσθέτοντας γείτονες με αντίστροφη σειρά για σταθερή προτεραιότητα.", "Παραλείπει processed cells και στο end ακολουθεί τα parents."],
        strengths: "Χρήσιμο για reachability, με iterative stack χωρίς recursion overflow.",
        weaknesses: "Μπορεί να κάνει μεγάλη παράκαμψη. Στο grid δεν εγγυάται μικρότερη μνήμη από BFS.",
        uses: "Έλεγχος αν δύο σημεία συνδέονται και εξερεύνηση κλάδων.",
        optimality: "Δεν εγγυάται ούτε ελάχιστα βήματα ούτε ελάχιστο κόστος.",
        weights: "Αγνοεί τα weights κατά την αναζήτηση.",
        complexity: linear.el,
        example: ["Grid 2×3: [0,1,2] / [3,4,5]. Χωρίς walls, unit costs, start=0, end=3.", "Η προτεραιότητα δεξιά πριν κάτω οδηγεί σε 0 → 1 → 2 → 5 → 4 → 3.", "5 βήματα, κόστος 5, παρότι υπάρχει η απευθείας σύνδεση 0 → 3."] },
      en: { ...common.en,
        what: "Depth-first search follows one branch before returning to alternatives.",
        intuition: "Go as deep as possible, then backtrack.",
        how: ["Put the start in a LIFO stack.", "Process the latest cell, pushing neighbours in reverse order to preserve priority.", "Skip processed cells and follow parents when the end is reached."],
        strengths: "Useful for reachability, with an iterative stack avoiding recursion overflow.",
        weaknesses: "Can take a long detour. On this grid, lower memory use than BFS is not guaranteed.",
        uses: "Connectivity checks and branch exploration.",
        optimality: "Guarantees neither minimum steps nor minimum cost.",
        weights: "Ignores weights during search.",
        complexity: linear.en,
        example: ["2×3 grid: [0,1,2] / [3,4,5]. No walls, unit costs, start=0, end=3.", "Right-before-down priority follows 0 → 1 → 2 → 5 → 4 → 3.", "5 steps, cost 5, although the direct connection 0 → 3 exists."] },
    },
    walkthrough: { input: uniform, path: [0,1,2,5,4,3], cost: 5 },
  },
  dijkstra: {
    name: "Dijkstra",
    education: {
      el: { ...common.el,
        what: "Αναζήτηση ελάχιστου συνολικού κόστους με μη αρνητικά weights.",
        intuition: "Επεκτείνει πρώτα τη φθηνότερη γνωστή διαδρομή.",
        how: ["Αρχικοποιεί g(start)=0 και βάζει το start σε min-heap.", "Αφαιρεί το cell με το μικρότερο g και βελτιώνει τα costs/parents των γειτόνων.", "Αγνοεί stale entries και σταματά όταν το end γίνει settled."],
        strengths: "Βρίσκει τη φθηνότερη διαδρομή χωρίς heuristic.",
        weaknesses: "Μπορεί να εξερευνήσει πολλές κατευθύνσεις και χρειάζεται heap.",
        uses: "Weighted terrain όταν έχει σημασία το συνολικό κόστος.",
        optimality: "Ελάχιστο κόστος με μη αρνητικά weights. Όχι απαραίτητα τα λιγότερα βήματα.",
        weights: "Υποστηρίζει non-negative costs, ακόμη και 0/fractions στο domain. Το UI χρησιμοποιεί 1/3/5.",
        complexity: heap.el,
        example: ["Grid 2×3: [0,1,2] / [3,4,5], costs [1,5,1] / [1,1,1], χωρίς walls, start=0, end=2.", "Από το 0, g(1)=5 και g(3)=1. Επεκτείνει τη φθηνή κάτω σειρά.", "Διαδρομή 0 → 3 → 4 → 5 → 2: 4 βήματα, κόστος 4. Η πάνω διαδρομή έχει 2 βήματα αλλά κόστος 6."] },
      en: { ...common.en,
        what: "Minimum-total-cost search with non-negative weights.",
        intuition: "Expand the cheapest known route first.",
        how: ["Set g(start)=0 and put the start in a min-heap.", "Remove the cell with minimum g and improve neighbour costs/parents.", "Skip stale entries and stop when the end is settled."],
        strengths: "Finds the cheapest route without a heuristic.",
        weaknesses: "May explore many directions and requires a heap.",
        uses: "Weighted terrain where total cost matters.",
        optimality: "Minimum cost with non-negative weights. Not necessarily the fewest steps.",
        weights: "Supports non-negative costs, including zero/fractions in the domain. The UI uses 1/3/5.",
        complexity: heap.en,
        example: ["2×3 grid: [0,1,2] / [3,4,5], costs [1,5,1] / [1,1,1], no walls, start=0, end=2.", "From 0, g(1)=5 and g(3)=1. Expand the cheap bottom row.", "Path 0 → 3 → 4 → 5 → 2: 4 steps, cost 4. The top route has 2 steps but costs 6."] },
    },
    walkthrough: { input: weighted, path: [0,3,4,5,2], cost: 4 },
  },
  astar: {
    name: "A*",
    education: {
      el: { ...common.el,
        what: "Αναζήτηση με f=g+h: κόστος μέχρι τώρα συν εκτίμηση του υπολοίπου.",
        intuition: "Συνδυάζει μια φθηνή διαδρομή με την κατεύθυνση προς τον στόχο.",
        how: ["Υπολογίζει h ως Manhattan distance × minimum walkable cost.", "Επιλέγει το μικρότερο f από min-heap και βελτιώνει g/parents.", "Παραλείπει stale entries και σταματά όταν το end αφαιρεθεί από το heap."],
        strengths: "Η heuristic μπορεί να περιορίσει την εξερεύνηση προς τον στόχο.",
        weaknesses: "Δεν είναι πάντα γρηγορότερο από Dijkstra. Ακατάλληλη heuristic μπορεί να χαλάσει την optimality.",
        uses: "Weighted cardinal grids με γνωστό στόχο και ασφαλή heuristic.",
        optimality: "Η συγκεκριμένη implementation βρίσκει ελάχιστο κόστος: scaled Manhattan είναι admissible και consistent για cardinal κινήσεις με non-negative costs.",
        weights: "Το scaling καλύπτει και fractions. Με minimum cost 0, h=0 και συμπεριφέρεται όπως ο Dijkstra. Χωρίς diagonals ή custom heuristics.",
        complexity: heap.el,
        example: ["Grid 2×3: [0,1,2] / [3,4,5], costs [1,5,1] / [1,1,1], χωρίς walls, start=0, end=2.", "Minimum=1. Από το 0: f(1)=5+1=6, f(3)=1+3=4. Επιλέγει την κάτω σειρά.", "Διαδρομή 0 → 3 → 4 → 5 → 2: 4 βήματα, κόστος 4, ίδιο βέλτιστο κόστος με Dijkstra."] },
      en: { ...common.en,
        what: "Search using f=g+h: cost so far plus an estimate of the remainder.",
        intuition: "Combine a cheap route with guidance toward the goal.",
        how: ["Compute h as Manhattan distance × minimum walkable cost.", "Select the smallest f from a min-heap and improve g/parents.", "Skip stale entries and stop when the end is removed from the heap."],
        strengths: "The heuristic may focus exploration toward the goal.",
        weaknesses: "Not always faster than Dijkstra. An unsuitable heuristic can break optimality.",
        uses: "Weighted cardinal grids with a known goal and a safe heuristic.",
        optimality: "This implementation finds minimum cost: scaled Manhattan is admissible and consistent for cardinal moves with non-negative costs.",
        weights: "Scaling also handles fractions. With minimum cost 0, h=0 and it behaves like Dijkstra. No diagonals or custom heuristics.",
        complexity: heap.en,
        example: ["2×3 grid: [0,1,2] / [3,4,5], costs [1,5,1] / [1,1,1], no walls, start=0, end=2.", "Minimum=1. From 0: f(1)=5+1=6, f(3)=1+3=4. Choose the bottom row.", "Path 0 → 3 → 4 → 5 → 2: 4 steps, cost 4, the same optimal cost as Dijkstra."] },
    },
    walkthrough: { input: weighted, path: [0,3,4,5,2], cost: 4 },
  },
} satisfies Record<AvailablePathfindingAlgorithm, PathfindingEducation>;
