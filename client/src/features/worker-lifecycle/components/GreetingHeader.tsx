type GreetingHeaderProps = {
  firstname: string;
};
const GreetingHeader = ({ firstname }: GreetingHeaderProps) => {
  return (
    <>
      <div className="flex pb-5 ">
        <p className="text-h5">Hallo, {firstname}</p>
      </div>
    </>
  );
};

export default GreetingHeader;
