Set shell = CreateObject("WScript.Shell")
If WScript.Arguments.Count < 1 Then WScript.Quit 1

launcher = WScript.Arguments(0)
command = """" & launcher & """ --hidden"
shell.Run command, 0, False
