/**
 * Regression coverage for `DropdownMenuItem`'s `asChild` support.
 *
 * `asChild` used to crash the entire page. The component wrapped its children as
 * `{icon && …}<span>{children}</span>{shortcut && …}` while forwarding `asChild` to the
 * Radix primitive; with `icon` and `shortcut` unset those two expressions evaluate to
 * `false`, and `false` still counts as a child, so Radix's `asChild` path called
 * `React.Children.only` on three children and threw
 * "React.Children.only expected to receive a single React element child."
 *
 * In the product this white-screened `/dam` the moment an asset's action menu opened.
 * The DAM asset menu was the only `asChild` caller in the repo, which is exactly why
 * every other dropdown kept working and nothing caught it.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/DropdownMenu';

function openMenu(children: React.ReactNode) {
  // `defaultOpen` renders the content immediately, which is what the crash needed —
  // the throw happened when the item mounted, not when the trigger was pressed.
  return render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe('DropdownMenuItem', () => {
  it('renders an asChild item without throwing', () => {
    expect(() =>
      openMenu(
        <DropdownMenuItem asChild>
          <a href="/somewhere">
            <svg aria-hidden="true" />
            View Details
          </a>
        </DropdownMenuItem>,
      ),
    ).not.toThrow();

    expect(screen.getByRole('menuitem')).toHaveAttribute('href', '/somewhere');
  });

  it('gives the caller element the menu item role rather than wrapping it', () => {
    openMenu(
      <DropdownMenuItem asChild>
        <a href="/detail">Open</a>
      </DropdownMenuItem>,
    );

    // Under `asChild` the caller owns the rendered element: the anchor *is* the item.
    // If the wrapper were still applied, the anchor would sit inside a div menuitem.
    const item = screen.getByRole('menuitem');
    expect(item.tagName).toBe('A');
    expect(item).toHaveTextContent('Open');
  });

  it('still decorates a normal item with its icon and shortcut', () => {
    openMenu(
      <DropdownMenuItem icon={<span data-testid="icon" />} shortcut="⌘K">
        Search
      </DropdownMenuItem>,
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
    expect(screen.getByRole('menuitem')).toHaveTextContent('Search');
  });
});
