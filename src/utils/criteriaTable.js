export const buildCriteriaTableRows = (criteriaSet) => {
    const groups = criteriaSet?.tieuChi || criteriaSet?.groups || [];
    const isNewFormat = !!criteriaSet?.tieuChi;

    if (!isNewFormat) {
        return groups.flatMap((group, groupIndex) =>
            (group.conditions || []).map((condition, conditionIndex) => ({
                id: condition.id,
                tcId: group.id,
                tcTitle: group.title || `Tieu chi ${groupIndex + 1}`,
                ndId: null,
                ndTitle: '',
                stt: condition.stt || conditionIndex + 1,
                dieuKienCham: condition.text || '',
                yeucauMinhChung: condition.requirement || '',
                guideFiles: condition.guideFiles || [],
                toTheoDoi: condition.toTheoDoi || '',
                khungDiem: Number(condition.maxScore) || 0,
                deadline: condition.deadline || '',
            }))
        );
    }

    return groups.flatMap((tc, tcIndex) =>
        (tc.noiDung || []).flatMap((noiDung, noiDungIndex) =>
            (noiDung.muc || []).map((muc, mucIndex) => ({
                id: muc.id,
                tcId: tc.id,
                tcTitle: tc.title || `Tieu chi ${tcIndex + 1}`,
                ndId: noiDung.id || `${tc.id}-nd-${noiDungIndex}`,
                ndTitle: noiDung.title || '',
                stt: muc.stt || mucIndex + 1,
                dieuKienCham: muc.dieuKienCham || '',
                yeucauMinhChung: muc.yeucauMinhChung || '',
                guideFiles: muc.guideFiles || [],
                toTheoDoi: muc.toTheoDoi || '',
                khungDiem: Number(muc.khungDiem) || 0,
                deadline: muc.deadline || '',
            }))
        )
    );
};
