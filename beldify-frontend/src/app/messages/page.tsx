import { redirect } from 'next/navigation';

/**
 * Buyer messaging has no top-level entry point outside /community/messages,
 * even though the backend (BuyerMessageController) handles general shop/PDP
 * messaging with no post_id fine. This route gives buyers a discoverable
 * /messages URL without duplicating the conversation-list page.
 */
export default function MessagesRedirect() {
  redirect('/community/messages');
}
