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

const App = () => {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState("");
  const [idToBeEdited, setIdToBeEdited] = useState(null);
  const [error, setError] = useState(false);
  const [inputRef, setInputFocus] = useFocus();

  useEffect(() => {
    loadNotes();
    const onCreateListener = onCreateSubscription();
    const onUpdateListener = onUpdateSubscription();
    const onDeleteListener = onDeleteSubscription();
    return () => {
      onCreateListener.unsubscribe();
      onUpdateListener.unsubscribe();
      onDeleteListener.unsubscribe();
    };
  }, []);

  const onCreateSubscription = () => {
    return API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: (noteData) => {
        saveNotes(noteData.value.data.onCreateNote);
      },
    });
  };

  const onUpdateSubscription = () => {
    return API.graphql(graphqlOperation(onUpdateNote)).subscribe({
      next: (noteData) => {
        updateNotes(noteData.value.data.onUpdateNote);
      },
    });
  };

  const onDeleteSubscription = () => {
    return API.graphql(graphqlOperation(onDeleteNote)).subscribe({
      next: (noteData) => {
        deleteNotes(noteData.value.data.onDeleteNote);
      },
    });
  };

  const loadNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  };

  const saveNotes = (note) => {
    // Using prevState allow us to get the last reliable previous state
    setNotes((prevNotes) => {
      const updatedNotes = [note, ...prevNotes];
      return updatedNotes;
    });
    setNote("");
    setInputFocus();
  };

  const updateNotes = (note) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((item) => {
        if (item.id === note.id) item.note = note.note;
        return item;
      });
      return updatedNotes;
    });
    setNote("");
    setInputFocus();
    setIdToBeEdited("");
  };

  const deleteNotes = (note) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.filter((item) => item.id !== note.id);
      return updatedNotes;
    });
    setNote("");
    setInputFocus();
    setError(false);
  };
  const handleDelete = async (id) => {
    await API.graphql(graphqlOperation(deleteNote, { input: { id } }));
  };

  const isExistingNote = () => {
    return idToBeEdited
      ? notes.findIndex((note) => note.id === idToBeEdited) !== -1
      : false;
  };
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (note && isExistingNote()) {
      await API.graphql(
        graphqlOperation(updateNote, { input: { note, id: idToBeEdited } })
      );
    } else if (note) {
      await API.graphql(graphqlOperation(createNote, { input: { note } }));
    } else {
      setError(true);
      setInputFocus();
    }
  };

  const handleChange = (e) => {
    setNote(e.target.value);
    setError(false);
  };

  const handleEditNote = (item) => {
    setNote(item.note);
    setIdToBeEdited(item.id);
    setInputFocus();
    setError(false);
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
};

export default withAuthenticator(App, {
  includeGreetings: true,
});
