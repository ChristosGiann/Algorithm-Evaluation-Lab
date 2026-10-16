import type { Language } from "../../i18n/translations";
import { stringSearchTexts } from "../../i18n/stringSearch";
import { codeUnitLabel } from "../../stringSearch/visualization";
import type { StringSearchAnimation, StringSearchFrame as Frame } from "../../stringSearch/visualization";
import "./StringSearch.css";
export function StringSearchFrame({animation,frame,language}:{animation:StringSearchAnimation;frame:Frame;language:Language}) {
  const t=stringSearchTexts[language], input=animation.input;
  const compare=frame.phase==="compare"?frame:null;
  const matched=(index:number)=>frame.phase==="done"&&animation.index!==null&&index>=animation.index&&index<animation.index+input.pattern.length;
  return <>
    <p>{t.offset}: {frame.offset}{compare&&<> · {compare.equal?t.match:t.mismatch} · text[{compare.textIndex}] / pattern[{compare.patternIndex}]</>}</p>
    {(frame.phase==="shift"||frame.phase==="fallback")&&<p>{t.next}: {frame.nextOffset}{frame.phase==="fallback"&&<> · {t.matched}: {frame.matched}</>}</p>}
    {frame.phase==="hash"&&<p>{t.hash}: {frame.windowHash} / {frame.patternHash} · {frame.equal?t.match:t.mismatch}</p>}
    <p>{t.legend}</p>
    <div className="string-trace" role="region" aria-label={t.offset} tabIndex={0}>
      <div className="string-track">
        <p>{t.text}</p><div className="string-row">{input.text.split("").map((unit,index)=><span key={index} className={"string-unit "+(compare?.textIndex===index?(compare.equal?"active match":"active mismatch"):matched(index)?"match":"")}><b>{codeUnitLabel(unit)}</b><small>{index}</small></span>)}{!input.text&&<span>{t.emptyText}</span>}</div>
        <p>{t.pattern}</p><div className="string-row" style={{paddingLeft:`${frame.offset*76}px`}}>{input.pattern.split("").map((unit,index)=><span key={index} className={"string-unit "+(compare?.patternIndex===index?(compare.equal?"active match":"active mismatch"):frame.phase==="done"&&animation.index!==null?"match":"")}><b>{codeUnitLabel(unit)}</b><small>{index}</small></span>)}{!input.pattern&&<span>{t.emptyPattern}</span>}</div>
      </div>
    </div>
  </>;
}
