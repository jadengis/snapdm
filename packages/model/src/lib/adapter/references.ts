export type DocumentData = Readonly<{
  [field: string]: unknown;
}>;

export interface DocumentReference<T = DocumentData> {
  /** The identifier of the document within its collection. */
  readonly id: string;

  /**
   * A reference to the Collection to which this DocumentReference belongs.
   */
  readonly parent: CollectionReference<T>;

  /**
   * A string representing the path of the referenced document (relative
   * to the root of the database).
   */
  readonly path: string;
}

/**
 * A `CollectionReference` object can be used for adding documents, getting
 * document references, and querying for documents (using {@link query}).
 */
export interface CollectionReference<T = DocumentData> {
  /** The identifier of the collection. */
  readonly id: string;

  /**
   * A reference to the containing Document if this is a subcollection, else
   * null.
   */
  readonly parent: DocumentReference<T> | null;

  /**
   * A string representing the path of the referenced collection (relative
   * to the root of the database).
   */
  readonly path: string;
}

export type ReferenceFactory = (
  collection: string,
  id: string,
  parent?: DocumentReference
) => DocumentReference;
