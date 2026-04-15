type GreetingHeaderProps = {
  firstname: string;
};
const GreetingHeader = ({ firstname }: GreetingHeaderProps) => {
  return (
    <>
      <div className="flex pb-5 ">
        <p className="typo-h5">Hallo, {firstname}</p>
      </div>
    </>
  );
};

export default GreetingHeader;
