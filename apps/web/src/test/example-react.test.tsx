import { render, screen } from "@testing-library/react";

function Greeting() {
  return <h1>Hello, Sergei!</h1>;
}

describe("Greeting", () => {
  it("renders greeting", () => {
    render(<Greeting />);

    expect(
      screen.getByRole("heading", { name: "Hello, Sergei!" }),
    ).toBeInTheDocument();
  });
});
