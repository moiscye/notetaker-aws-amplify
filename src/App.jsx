import React, { useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from "./graphql/subscriptions";
import { listNotes } from "./graphql/queries";
import useFocus from "./common/useFocus";
import "./App.scss";
import { useDidMount } from "./common/useDidMount";

function App() {
  const didMount = useDidMount();
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState("");
  const [idToBeEdited, setIdToBeEdited] = useState(null);
  const [error, setError] = useState(false);
  const [inputRef, setInputFocus] = useFocus();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  };

  const handleDelete = async (id) => {
    const input = { id };
    const result = await API.graphql(graphqlOperation(deleteNote, { input }));
    const updatedNotes = notes.filter(
      (item) => item.id !== result.data.deleteNote.id
    );
    saveAndClear(updatedNotes);
    setError(false);
  };

  const saveAndClear = (noteToBeUpdated) => {
    setNotes(noteToBeUpdated);
    setNote("");
    setInputFocus();
  };

  const isExistingNote = () => {
    return idToBeEdited
      ? notes.findIndex((note) => note.id === idToBeEdited) !== -1
      : false;
  };
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (note && isExistingNote()) {
      handleUpdateNote();
    } else if (note) {
      const input = { note };
      const result = await API.graphql(graphqlOperation(createNote, { input }));
      const newNote = result.data.createNote;
      const updatedNotes = [newNote, ...notes];
      saveAndClear(updatedNotes);
    } else {
      setError(true);
      setInputFocus();
    }
  };
  const handleUpdateNote = async () => {
    const input = { note, id: idToBeEdited };
    const result = await API.graphql(graphqlOperation(updateNote, { input }));
    const updatedNote = result.data.updateNote;
    const updatedNotes = notes.map((item) => {
      if (item.id === updatedNote.id) item.note = updatedNote.note;
      return item;
    });
    saveAndClear(updatedNotes);
    setIdToBeEdited(null);
  };

  const handleChange = (e) => {
    setNote(e.target.value);
    setError(false);
  };

  const handleEditNote = (item) => {
    setNote(item.note);
    setIdToBeEdited(item.id);
    setInputFocus();
  };
  const showError = () => (
    <span className="error">Please write a note before submitting!</span>
  );

  return (
    <div className="wrapper">
      <div className="content">
        <h1>Notetaker </h1>
        <form className="form" onSubmit={handleAddNote}>
          <input
            value={note}
            ref={inputRef}
            onChange={(e) => handleChange(e)}
            type="text"
            placeholder="Write your note"
          />
          <button type="submit">
            {idToBeEdited ? "Update Note" : "Add Note"}
          </button>
        </form>
        {error ? showError() : null}
        <div className="notes">
          {notes.map((item) => (
            <div className="notes__list" key={item.id}>
              <li onClick={() => handleEditNote(item)}>{item.note}</li>
              <button onClick={() => handleDelete(item.id)}>
                <span>&times;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default withAuthenticator(App, {
  includeGreetings: true,
});
