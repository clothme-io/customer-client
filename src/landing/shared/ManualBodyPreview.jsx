import { MANUAL_SHAPES } from "../../lib/manualSizeProfile";
import { getBodyPreviewWidths } from "../../lib/manualBodyPreview";

export function ManualBodyPreview({ shape, gender, cup }) {
  const { shoulders, chest, waist, hips } = getBodyPreviewWidths(shape, gender, cup);
  const shapeName = MANUAL_SHAPES.find(([value]) => value === shape)?.[1] || "Choose a shape";
  const cupName = gender === "female" && cup ? ` · cup ${cup}` : "";
  const figure = `M ${120 - shoulders} 72
    Q ${120 - chest - 8} 87 ${120 - chest} 112
    Q ${120 - waist} 144 ${120 - waist} 164
    Q ${120 - hips - 3} 190 ${120 - hips} 208
    Q ${120 - hips + 5} 231 102 232
    L 109 310 L 119 310 L 120 236
    L 121 310 L 131 310 L 138 232
    Q ${120 + hips - 5} 231 ${120 + hips} 208
    Q ${120 + hips + 3} 190 ${120 + waist} 164
    Q ${120 + waist} 144 ${120 + chest} 112
    Q ${120 + chest + 8} 87 ${120 + shoulders} 72
    Q 137 66 132 62 L 108 62 Q 103 66 ${120 - shoulders} 72 Z`;

  return (
    <div className="size-tool-body-preview">
      <div className="size-tool-body-preview-header">
        <strong>Body shape preview</strong>
        <span>Illustration</span>
      </div>
      <svg viewBox="0 0 240 330" role="img" aria-label={`${shapeName}${cupName} body shape illustration`}>
        <circle cx="120" cy="170" r="111" fill="#edf8fe" />
        <circle cx="120" cy="35" r="19" fill="#1599e3" />
        <path d={figure} fill="#1599e3" stroke="#117fbc" strokeWidth="2" strokeLinejoin="round" />
        <path d={`M ${120 - shoulders} 73 Q ${120 - shoulders - 8} 88 ${120 - shoulders - 10} 110 L ${120 - shoulders - 16} 185 Q ${120 - shoulders - 10} 193 ${120 - shoulders - 5} 186 L ${120 - shoulders + 4} 126`} fill="#1599e3" stroke="#117fbc" strokeWidth="2" strokeLinejoin="round" />
        <path d={`M ${120 + shoulders} 73 Q ${120 + shoulders + 8} 88 ${120 + shoulders + 10} 110 L ${120 + shoulders + 16} 185 Q ${120 + shoulders + 10} 193 ${120 + shoulders + 5} 186 L ${120 + shoulders - 4} 126`} fill="#1599e3" stroke="#117fbc" strokeWidth="2" strokeLinejoin="round" />
        <path d={`M ${120 - chest + 7} 112 Q 120 120 ${120 + chest - 7} 112`} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />
        <path d={`M ${120 - waist + 5} 164 Q 120 169 ${120 + waist - 5} 164`} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />
      </svg>
      <p>{shapeName}{cupName}</p>
      <small>This illustration changes with your choices. Your sizing estimate comes after you generate it.</small>
    </div>
  );
}
