export const Header = () => {
  return (
    <header>
      <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
        <div className="flex flex-wrap justify-between items-center">
          <a href="/" className="flex items-center">
            <img
              src="https://lh3.googleusercontent.com/ogw/AF2bZyhWlV3tfv8X3f7KVAna1oW6yJrF6wSHDFHEBYiPL5fKOQ=s32-c-mo"
              className="mr-3 h-6 sm:h-9 rounded-full"
              alt=""
            />
            <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
              Mesh generator
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
};
