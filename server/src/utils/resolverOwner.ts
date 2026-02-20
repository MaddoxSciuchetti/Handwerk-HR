type TAuthUser = {
    employeeStatus: {
        absence: string | null;
        absencetype: string | null;
        absencebegin: Date | null;
        absenceEnd: Date | null;
        substitute: string | null;
        sub_user: {
            id: string;
            nachname: string;
            vorname: string;
        } | null;
    }[];
    id: string;
    nachname: string;
    vorname: string;
};

const resolveOwner = (auth_user: TAuthUser) => {
    const status = auth_user.employeeStatus?.[0];
    const isAbsent =
        status?.absencebegin &&
        status?.absenceEnd &&
        new Date() >= new Date(status.absencebegin) &&
        new Date() <= new Date(status.absenceEnd);

    if (isAbsent && status.sub_user) {
        return {
            id: status.sub_user.id,
            vorname: status.sub_user.vorname,
            nachname: status.sub_user.nachname,
            isSubstitute: true,
        };
    }

    return {
        id: auth_user.id,
        vorname: auth_user.vorname,
        nachname: auth_user.nachname,
        isSubstitute: false,
    };
};

export default resolveOwner;
