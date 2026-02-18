const resolveOwner = (auth_user: any) => {
    const status = auth_user.employeeStatus?.[0];
    const isAbsent =
        status?.absence &&
        status?.absenceEnd &&
        new Date(status.absenceEnd) > new Date();

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
