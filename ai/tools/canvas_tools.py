CANVAS_TOOLS = [
    {
        "name": "place_sticky",
        "description": "Place a new sticky note on the canvas.",
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "Short text for the idea/sticky note (3-8 words)."
                },
                "x": {
                    "type": "number",
                    "description": "The x coordinate for the sticky note placement."
                },
                "y": {
                    "type": "number",
                    "description": "The y coordinate for the sticky note placement."
                },
                "reasoning": {
                    "type": "string",
                    "description": "Reasoning for the idea and its spatial placement."
                },
                "tentative": {
                    "type": "boolean",
                    "description": "True if the idea is creative/risky, false if obvious."
                }
            },
            "required": ["content", "x", "y", "reasoning", "tentative"]
        }
    },
    {
        "name": "group_ideas",
        "description": "Group existing ideas together under a common label.",
        "input_schema": {
            "type": "object",
            "properties": {
                "shape_ids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "Array of string IDs of the shapes to group."
                },
                "label": {
                    "type": "string",
                    "description": "A summarizing label for the group."
                }
            },
            "required": ["shape_ids", "label"]
        }
    }
]
