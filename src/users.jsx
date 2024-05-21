import React from "react"

export default function Users({users, createPrivateRoom}) {
    console.log(users);
    return(
        <div>
            <h5>Online Users:</h5>
            <div>
                <ul>
                    {users.map((user, idx) => {
                        return(
                            <li>
                                <button onClick={()=>{createPrivateRoom(user)}}>
                                    {user}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}