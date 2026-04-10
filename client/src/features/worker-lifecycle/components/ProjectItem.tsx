import {
  Cell,
  CellHolder,
  GrowingItem,
  Items,
} from '@/components/ui/selfmade/table/Table';

function ProjectItem() {
  return (
    <Items className="flex relative items-center">
      <img
        className="opacity-0 group-hover:opacity-100 absolute w-5 h-5 ml-2 group"
        src="assets/BoxSelect.svg"
      />
      <GrowingItem className="pl-10 py-0">
        <p className="text-body-base">Maddox</p>
      </GrowingItem>
      <CellHolder>
        <Cell>Priority</Cell>
        <Cell>Lead</Cell>
        <Cell>Status</Cell>
        <Cell>Zuletzt bearbeitet</Cell>
      </CellHolder>
    </Items>
  );
}

export default ProjectItem;
