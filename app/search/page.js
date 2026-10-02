export const metadata = { title: 'Search Products' };
export default function SearchPage() {
  return (
    <main className="container section arone-mobile-route">
      <span className="eyebrow">FIND YOUR FAVOURITES</span>
      <h1>Search Products</h1>
      <form action="/shop" method="GET" className="arone-mobile-search-form" role="search">
        <label htmlFor="arone-product-search">Product name</label>
        <div><input id="arone-product-search" name="q" type="search" placeholder="Search cookware, tawa, kadai..." required autoFocus/><button className="btn btn-primary" type="submit">Search</button></div>
      </form>
    </main>
  );
}
