export const searchingTexts = {
  el: {title:"Searching βήμα προς βήμα",note:"Εκπαιδευτικό trace έως 64 στοιχεία. Η ταχύτητα animation δεν είναι μέτρηση απόδοσης. Binary/Jump/Exponential απαιτούν ascending input· δεν γίνεται αυτόματο sorting.",
    values:"Συλλογή αριθμών (κόμμα ή κενό, κενή επιτρέπεται)",target:"Target",algorithm:"Αλγόριθμος",load:"Φόρτωση trace",invalid:"Δώσε έως 64 finite αριθμούς και έγκυρο target.",sorted:"Απαιτείται ταξινομημένο input σε αύξουσα σειρά.",
    play:"Play",pause:"Pause",step:"Step",reset:"Reset",speed:"Ταχύτητα animation",frame:"Βήμα",range:"Ενεργό εύρος",probe:"Τρέχον probe",visited:"Εξετασμένες θέσεις",found:"Βρέθηκε στο index",absent:"Δεν βρέθηκε",empty:"Φόρτωσε trace για να ξεκινήσεις.",index:"Index",
    legend:"Πορτοκαλί περίγραμμα: current probe · μπλε: visited · υπογράμμιση: active range · πράσινο: match.",
    phases:{initial:"Αρχή",done:"Ολοκληρώθηκε",scan:"Γραμμική σάρωση",binary:"Binary phase / midpoint",jump:"Άκρο block",expand:"Επέκταση εύρους"}},
  en: {title:"Searching step by step",note:"Educational trace up to 64 items. Animation speed is not a performance measurement. Binary/Jump/Exponential require ascending input; no automatic sorting.",
    values:"Number collection (commas or spaces, empty allowed)",target:"Target",algorithm:"Algorithm",load:"Load trace",invalid:"Enter up to 64 finite numbers and a valid target.",sorted:"Ascending sorted input is required.",
    play:"Play",pause:"Pause",step:"Step",reset:"Reset",speed:"Animation speed",frame:"Step",range:"Active range",probe:"Current probe",visited:"Visited indexes",found:"Found at index",absent:"Not found",empty:"Load a trace to begin.",index:"Index",
    legend:"Orange outline: current probe · blue: visited · underline: active range · green: match.",
    phases:{initial:"Initial",done:"Completed",scan:"Linear scan",binary:"Binary phase / midpoint",jump:"Block boundary",expand:"Range expansion"}},
} as const;
