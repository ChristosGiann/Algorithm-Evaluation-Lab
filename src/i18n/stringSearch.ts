export const stringSearchTexts = {
  el: {
    title:"String Search βήμα προς βήμα", note:"Εκπαιδευτικό trace έως 64 text / 16 pattern UTF-16 code units. Case-sensitive, χωρίς normalization. Τα U+XXXX δείχνουν κενά/control/surrogate units. Η ταχύτητα animation δεν είναι χρόνος benchmark.",
    text:"Κείμενο", pattern:"Pattern", algorithm:"Αλγόριθμος", load:"Φόρτωση trace", invalid:"Επίτρεπτα έως 64 text και 16 pattern UTF-16 code units.",
    play:"Play",pause:"Pause",step:"Step",reset:"Reset",speed:"Ταχύτητα animation",frame:"Βήμα",offset:"Alignment",next:"Επόμενο alignment",matched:"Prefix που διατηρείται",found:"Βρέθηκε στο index",absent:"Δεν βρέθηκε",empty:"Φόρτωσε trace για να ξεκινήσεις.",
    match:"Match", mismatch:"Mismatch", hash:"Window hash / pattern hash", emptyText:"Κενό κείμενο", emptyPattern:"Κενό pattern: πρώτο match στο 0", legend:"Πορτοκαλί περίγραμμα: ενεργή σύγκριση · πράσινο: match · κόκκινο: mismatch. Text και pattern μοιράζονται την ίδια κλίμακα θέσεων.",
    phases:{initial:"Αρχή",done:"Ολοκληρώθηκε",compare:"Σύγκριση χαρακτήρων",fallback:"KMP fallback μέσω LPS",shift:"Μετατόπιση pattern",hash:"Hash window — απαιτείται verification σε hash match"},
  },
  en: {
    title:"String Search step by step",note:"Educational trace up to 64 text / 16 pattern UTF-16 code units. Case-sensitive, without normalization. U+XXXX displays whitespace/control/surrogate units. Animation speed is not benchmark time.",
    text:"Text",pattern:"Pattern",algorithm:"Algorithm",load:"Load trace",invalid:"Use up to 64 text and 16 pattern UTF-16 code units.",
    play:"Play",pause:"Pause",step:"Step",reset:"Reset",speed:"Animation speed",frame:"Step",offset:"Alignment",next:"Next alignment",matched:"Retained prefix",found:"Found at index",absent:"Not found",empty:"Load a trace to begin.",
    match:"Match",mismatch:"Mismatch",hash:"Window hash / pattern hash",emptyText:"Empty text",emptyPattern:"Empty pattern: first match at 0",legend:"Orange outline: current comparison · green: match · red: mismatch. Text and pattern share the same position scale.",
    phases:{initial:"Initial",done:"Completed",compare:"Character comparison",fallback:"KMP fallback through LPS",shift:"Pattern shift",hash:"Hash window — hash matches require verification"},
  },
} as const;
