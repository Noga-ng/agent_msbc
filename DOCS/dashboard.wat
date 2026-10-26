// function changeStatus(member: Member, nextStatus: Status) {
  //   const updated = { 
  //     ...member, 
  //     status: nextStatus, 
  //     updatedAt: new Date().toISOString()
  //    };

  //   onMembersChange(
  //     members.map((item) => 
  //       item.id === member.id 
  //     ? updated 
  //     : item
  //   ));

  //   setSelected(updated);
  // }

  // function deleteMember(member: Member) {
  //   if (!window.confirm(`Supprimer définitivement le profil de ${member.fullName} ?`)) return;
  //   onMembersChange(
  //     members.filter((item) =>
  //        item.id !== member.id
  //   ));
  //   setSelected(null);
  // }
