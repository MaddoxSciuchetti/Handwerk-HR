import { Button } from "../ui/button";

type TCloseModal = {
  onClose: () => void;
};

function AdminModal({ onClose }: TCloseModal) {
  return (
    <>
      <div
        onClick={onClose}
        className="h-screen inset-0 fixed z-40 bg-black/60"
      ></div>
      <div className="absolute text-center items-center z-50 bg-gray-200 rounded-xl top-[20%] left-[50%] h-2/5 w-2xl -translate-x-1/2 -translate-y-1/2">
        <div>This is the modal content</div>
        <Button className="">
          Placer Holder Notification to Owner "Owner"
        </Button>
        <p>Email Vorlage</p>
        <textarea placeholder="schreibe hier"></textarea>
        <Button>Send Email</Button>
      </div>
    </>
  );
}

export default AdminModal;
