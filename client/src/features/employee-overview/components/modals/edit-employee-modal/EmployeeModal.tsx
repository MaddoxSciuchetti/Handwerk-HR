import useGetOrgUsers from '@/features/employee-overview/hooks/useGetEmployees';
import SmallWrapper from '../../../../../components/modal/modalSizes/SmallWrapper';
import FormModalEdit from './FormModal.Edit';

type EditOrgUserProps = {
  fullname: string;
  toggleEmployeeModal: () => void;
  id: string | undefined;
};

function EditOrgUser({ fullname, toggleEmployeeModal, id }: EditOrgUserProps) {
  const { OrgUsers } = useGetOrgUsers();

  return (
    <SmallWrapper className="items-stretch justify-start overflow-hidden">
      <FormModalEdit
        id={id}
        fullname={fullname}
        OrgUsers={OrgUsers}
        toggleEmployeeModal={toggleEmployeeModal}
      />
    </SmallWrapper>
  );
}

export default EditOrgUser;
